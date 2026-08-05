import json
import os
from pathlib import Path
from models import Base, Player, Team, AuctionState, engine, SessionLocal

DATA_DIR = Path(__file__).parent.parent / "data"


def _load_data(db):
    with open(DATA_DIR / "players.json") as f:
        players_data = json.load(f)
    with open(DATA_DIR / "teams.json") as f:
        teams_data = json.load(f)

    for t in teams_data:
        team = Team(
            id=t["id"],
            team_name=t["team_name"],
            marquee_player_name=t["marquee_player_name"],
            apartment=t.get("apartment"),
            color=t.get("color", "#1A3C6E"),
            secondary_color=t.get("secondary_color", "#FFD700"),
        )
        db.add(team)

    for p in players_data:
        player = Player(
            id=p["id"],
            name=p["name"],
            position=p["position"],
            tier=p["tier"],
            jersey_number=p["jersey_number"],
            apartment=p.get("apartment"),
            image=p.get("image"),
            pace=p.get("pace", 70),
            technique=p.get("technique", 70),
            physicality=p.get("physicality", 70),
            vision=p.get("vision", 70),
            stamina=p.get("stamina", 70),
            aggression=p.get("aggression", 70),
        )
        db.add(player)

    db.add(AuctionState(id=1, current_tier=1, phase="idle"))
    db.commit()


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Player).count() > 0:
            return  # Already seeded
        _load_data(db)
        print("Database seeded successfully.")
    finally:
        db.close()


def reset_and_reseed():
    """Wipe all auction data and reseed from JSON files."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _load_data(db)
        print("Database reset and reseeded.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
