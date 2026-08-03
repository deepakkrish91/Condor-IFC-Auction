from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import random

from models import Player, Team, AuctionState, get_db
from auth import require_admin
from seed import reset_and_reseed
from auction_engine import (
    validate_bid, apply_bid, available_bid_amount,
    TIER_BASE_BID, MAX_BUDGET
)
from broadcaster import broadcaster

router = APIRouter(prefix="/admin", tags=["admin"])


def _player_dict(p: Player) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "position": p.position,
        "tier": p.tier,
        "jersey_number": p.jersey_number,
        "apartment": p.apartment,
        "pace": p.pace,
        "technique": p.technique,
        "physicality": p.physicality,
        "vision": p.vision,
        "stamina": p.stamina,
        "aggression": p.aggression,
        "status": p.status,
        "final_bid": p.final_bid,
        "team_id": p.team_id,
        "team_name": p.team.team_name if p.team else None,
        "base_bid": TIER_BASE_BID[p.tier],
    }


def _team_dict(t: Team) -> dict:
    return {
        "id": t.id,
        "team_name": t.team_name,
        "marquee_player_name": t.marquee_player_name,
        "apartment": t.apartment,
        "color": t.color,
        "secondary_color": t.secondary_color,
        "marquee_valuation": t.marquee_valuation,
        "highest_bid": t.highest_bid,
        "gross_spent": t.gross_spent,
        "players_needed": t.players_needed,
        "available_to_bid": available_bid_amount(t),
        "players": [_player_dict(p) for p in t.players],
    }


@router.get("/players")
def list_players(db: Session = Depends(get_db), _=Depends(require_admin)):
    players = db.query(Player).order_by(Player.tier, Player.id).all()
    return [_player_dict(p) for p in players]


@router.get("/teams")
def list_teams(db: Session = Depends(get_db), _=Depends(require_admin)):
    teams = db.query(Team).all()
    return [_team_dict(t) for t in teams]


@router.get("/state")
def get_state(db: Session = Depends(get_db), _=Depends(require_admin)):
    state = db.query(AuctionState).first()
    current_player = None
    if state.current_player_id:
        p = db.query(Player).get(state.current_player_id)
        if p:
            current_player = _player_dict(p)
    return {
        "phase": state.phase,
        "current_tier": state.current_tier,
        "current_player": current_player,
    }


@router.post("/auction/start")
async def start_auction(db: Session = Depends(get_db), _=Depends(require_admin)):
    """Randomly pick the next available player from the current tier."""
    state = db.query(AuctionState).first()

    available = (
        db.query(Player)
        .filter(Player.tier == state.current_tier, Player.status == "available")
        .all()
    )

    if not available:
        # Try advancing tier
        next_tier = state.current_tier + 1
        if next_tier > 3:
            state.phase = "idle"
            db.commit()
            await broadcaster.broadcast({"event": "auction_complete"})
            return {"message": "All tiers complete. Auction finished."}

        state.current_tier = next_tier
        db.commit()
        available = (
            db.query(Player)
            .filter(Player.tier == next_tier, Player.status == "available")
            .all()
        )
        if not available:
            return {"message": f"No players available in tier {next_tier}."}

    player = random.choice(available)

    # TEDDY must not be the first player picked in Tier 1
    tier1_sold_count = db.query(Player).filter(
        Player.tier == 1, Player.status.in_(["sold", "unsold"])
    ).count()
    if player.name.upper() == "TEDDY" and state.current_tier == 1 and tier1_sold_count == 0:
        others = [p for p in available if p.name.upper() != "TEDDY"]
        if others:
            player = random.choice(others)

    player.status = "in_auction"
    state.current_player_id = player.id
    state.phase = "live"
    db.commit()
    db.refresh(player)

    payload = {
        "event": "player_up",
        "player": _player_dict(player),
        "tier": state.current_tier,
    }
    await broadcaster.broadcast(payload)
    return payload


class SellRequest(BaseModel):
    player_id: int
    team_id: int
    final_bid: int


@router.post("/auction/sell")
async def sell_player(req: SellRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    player = db.query(Player).get(req.player_id)
    team = db.query(Team).get(req.team_id)

    if not player or not team:
        raise HTTPException(status_code=404, detail="Player or team not found.")
    if player.status != "in_auction":
        raise HTTPException(status_code=400, detail="Player is not currently in auction.")

    base_bid = TIER_BASE_BID[player.tier]
    validation = validate_bid(team, req.final_bid, base_bid)

    if not validation["ok"]:
        # Mark for re-auction
        player.status = "available"
        state = db.query(AuctionState).first()
        state.phase = "reauction"
        state.current_player_id = None
        db.commit()

        await broadcaster.broadcast({
            "event": "bid_blocked",
            "reason": validation["reason"],
            "player": _player_dict(player),
            "team": _team_dict(team),
        })
        raise HTTPException(status_code=422, detail=validation["reason"])

    apply_bid(team, req.final_bid)
    player.status = "sold"
    player.final_bid = req.final_bid
    player.team_id = team.id

    state = db.query(AuctionState).first()
    state.phase = "sold"
    state.current_player_id = None
    db.commit()
    db.refresh(player)
    db.refresh(team)

    teams_snapshot = [_team_dict(t) for t in db.query(Team).all()]
    await broadcaster.broadcast({
        "event": "player_sold",
        "player": _player_dict(player),
        "team": _team_dict(team),
        "teams": teams_snapshot,
    })
    return {"message": "Player sold.", "player": _player_dict(player), "team": _team_dict(team)}


class UnsoldRequest(BaseModel):
    player_id: int


@router.post("/auction/unsold")
async def unsold_player(req: UnsoldRequest, db: Session = Depends(get_db), _=Depends(require_admin)):
    player = db.query(Player).get(req.player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found.")

    player.status = "unsold"
    state = db.query(AuctionState).first()
    state.phase = "unsold"
    state.current_player_id = None
    db.commit()
    db.refresh(player)

    teams_snapshot = [_team_dict(t) for t in db.query(Team).all()]
    await broadcaster.broadcast({
        "event": "player_unsold",
        "player": _player_dict(player),
        "teams": teams_snapshot,
    })
    return {"message": "Player marked unsold."}


@router.post("/reset")
async def reset_auction(_=Depends(require_admin)):
    reset_and_reseed()
    await broadcaster.broadcast({"event": "auction_reset"})
    return {"message": "Auction has been reset and reseeded."}
