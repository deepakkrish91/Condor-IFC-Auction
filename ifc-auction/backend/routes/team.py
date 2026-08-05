from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from models import Player, Team, get_db
from auth import get_current_role
from auction_engine import available_bid_amount, TIER_BASE_BID

router = APIRouter(prefix="/team", tags=["team"])


def _player_dict(p: Player) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "position": p.position,
        "tier": p.tier,
        "jersey_number": p.jersey_number,
        "apartment": p.apartment,
        "image": p.image,
        "pace": p.pace,
        "technique": p.technique,
        "physicality": p.physicality,
        "vision": p.vision,
        "stamina": p.stamina,
        "aggression": p.aggression,
        "status": p.status,
        "final_bid": p.final_bid,
        "base_bid": TIER_BASE_BID[p.tier],
    }


@router.get("/all")
def all_teams(db: Session = Depends(get_db), _=Depends(get_current_role)):
    teams = db.query(Team).all()
    result = []
    for t in teams:
        result.append({
            "id": t.id,
            "team_name": t.team_name,
            "marquee_player_name": t.marquee_player_name,
            "color": t.color,
            "secondary_color": t.secondary_color,
            "gross_spent": t.gross_spent,
            "marquee_valuation": t.marquee_valuation,
            "players_needed": t.players_needed,
            "available_to_bid": available_bid_amount(t),
            "players": [_player_dict(p) for p in t.players],
        })
    return result
