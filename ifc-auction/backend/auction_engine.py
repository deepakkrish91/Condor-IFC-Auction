"""
Core auction business logic and budget validation.
All monetary values are in Indian Rupees (INR).
"""

MAX_BUDGET = 1_000_000        # Rs 10,00,000
RESERVE_PER_PLAYER = 25_000   # Rs 25,000 reserve per remaining slot
TIER_BASE_BID = {1: 50_000, 2: 30_000, 3: 25_000}
MARQUEE_VALUATION_MULTIPLIER = 1.25
TOTAL_PLAYERS_PER_TEAM = 6    # excluding marquee


def available_bid_amount(team) -> int:
    """
    Amount a team can bid right now.
    = (max_budget - gross_spent) - (players_still_needed - 1) * reserve_per_player
    The -1 accounts for the player currently being bid on.
    """
    if team.players_needed <= 0:
        return 0
    gross_remaining = MAX_BUDGET - team.gross_spent
    locked_reserve = (team.players_needed - 1) * RESERVE_PER_PLAYER
    return max(0, gross_remaining - locked_reserve)


def marquee_valuation_after_bid(team, bid_amount: int) -> int:
    """
    Marquee valuation only updates if bid_amount exceeds the team's previous highest bid.
    """
    if bid_amount > team.highest_bid:
        return int(bid_amount * MARQUEE_VALUATION_MULTIPLIER)
    return team.marquee_valuation


def gross_spent_after_bid(team, bid_amount: int) -> int:
    """
    New gross_spent after a successful bid.
    Deducts old marquee valuation and adds new one if highest bid changes.
    """
    old_valuation = team.marquee_valuation
    new_valuation = marquee_valuation_after_bid(team, bid_amount)
    return team.gross_spent - old_valuation + bid_amount + new_valuation


def validate_bid(team, bid_amount: int, base_bid: int) -> dict:
    """
    Returns {"ok": True} or {"ok": False, "reason": str}
    """
    if team.players_needed <= 0:
        return {"ok": False, "reason": f"Team {team.team_name} already has a full squad."}

    if bid_amount < base_bid:
        return {
            "ok": False,
            "reason": f"Bid ₹{bid_amount:,} is below the base bid of ₹{base_bid:,}."
        }

    max_allowed = available_bid_amount(team)
    if bid_amount > max_allowed:
        return {
            "ok": False,
            "reason": (
                f"Team {team.team_name} can only bid up to ₹{max_allowed:,} right now "
                f"(budget remaining after reserves: ₹{max_allowed:,})."
            )
        }

    return {"ok": True}


def apply_bid(team, bid_amount: int):
    """Mutates team object in place after a valid bid. Caller must commit the DB session."""
    new_gross = gross_spent_after_bid(team, bid_amount)
    new_valuation = marquee_valuation_after_bid(team, bid_amount)

    if bid_amount > team.highest_bid:
        team.highest_bid = bid_amount
    team.marquee_valuation = new_valuation
    team.gross_spent = new_gross
    team.players_needed -= 1
