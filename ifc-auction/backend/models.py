from sqlalchemy import create_engine, Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

DATABASE_URL = "sqlite:///./auction.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    position = Column(String, nullable=False)
    tier = Column(Integer, nullable=False)
    jersey_number = Column(Integer, nullable=False)
    apartment = Column(String, nullable=True)
    image = Column(String, nullable=True)
    pace = Column(Integer, default=70)
    technique = Column(Integer, default=70)
    physicality = Column(Integer, default=70)
    vision = Column(Integer, default=70)
    stamina = Column(Integer, default=70)
    aggression = Column(Integer, default=70)
    status = Column(String, default="available")  # available | in_auction | sold | unsold
    final_bid = Column(Integer, nullable=True)
    reaucted = Column(Boolean, default=False)  # True after going unsold in the re-auction round
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=True)
    team = relationship("Team", back_populates="players")


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    team_name = Column(String, nullable=False)
    marquee_player_name = Column(String, nullable=False)
    apartment = Column(String, nullable=True)
    color = Column(String, default="#1A3C6E")
    secondary_color = Column(String, default="#FFD700")
    marquee_valuation = Column(Integer, default=0)
    highest_bid = Column(Integer, default=0)
    gross_spent = Column(Integer, default=0)
    players_needed = Column(Integer, default=7)  # 7 more after marquee
    players = relationship("Player", back_populates="team")


class AuctionState(Base):
    __tablename__ = "auction_state"

    id = Column(Integer, primary_key=True, default=1)
    current_player_id = Column(Integer, nullable=True)
    current_tier = Column(Integer, default=1)
    phase = Column(String, default="idle")  # idle | live | sold | unsold | reauction | reauction_round
    reauction_player_id = Column(Integer, nullable=True)
    in_reauction_round = Column(Boolean, default=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
