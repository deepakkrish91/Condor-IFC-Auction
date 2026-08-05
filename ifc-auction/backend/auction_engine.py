"""
Core auction business logic and budget validation.
All monetary values are in Indian Rupees (INR).
"""

MAX_BUDGET = 1_000_000        # Rs 10,00,000
RESERVE_PER_PLAYER = 20_000   # Rs 20,000 reserve per remaining slot
TIER_BASE_BID = {1: 50_000, 2: 30_000, 3: 20_000}
MARQUEE_VALUATION_MULTIPLIER = 1.25
TOTAL_PLAYERS_PER_TEAM = 7    # excluding marquee


def available_bid_amount(team) -> int:
    """
    Amount a team can bid right now, conservatively assuming the bid will become
    the new highest bid (worst case: marquee valuation multiplier applies).

    Derivation — after a winning bid `b` that beats highest_bid:
        new_gross = gross_spent - old_valuation + b + b * MULTIPLIER
        headroom  = MAX_BUDGET - new_gross - locked_reserve >= 0
        => b * (1 + MULTIPLIER) <= MAX_BUDGET - (gross_spent - old_valuation) - locked_reserve
        => b <= effective_headroom / (1 + MULTIPLIER)

    If the bid does NOT beat highest_bid the multiplier won't apply, so the team
    will have more room — this cap is always safe.
    """
    if team.players_needed <= 0:
        return 0
    locked_reserve = (team.players_needed - 1) * RESERVE_PER_PLAYER
    # Budget available after stripping out the old marquee valuation (it will be replaced)
    effective_headroom = MAX_BUDGET - (team.gross_spent - team.marquee_valuation) - locked_reserve
    # Divide by (1 + multiplier) to ensure bid + new_valuation fits within headroom
    max_bid = int(effective_headroom / (1 + MARQUEE_VALUATION_MULTIPLIER))
    return max(0, max_bid)


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
