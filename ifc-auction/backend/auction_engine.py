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
    Max a team can bid right now, matching the Excel simulation logic.

    Gross balance F = MAX_BUDGET - Reserve - Spent
      Reserve = 20000 * (players_needed - 1)   [slots still to fill after this one]
      Spent   = gross_spent (already includes current marquee valuation C)

    Max available E:
      IF F >= highest_bid → new highest bid is possible → (F + C) / 2.25
                            absorbs the 1.25x marquee uplift that would be added
      ELSE                → bid can't beat highest_bid → no uplift risk → return F

    Derivation of (F + C) / 2.25:
      After new winning bid b:  new_spent = spent - C + b + b*1.25 = spent - C + 2.25*b
      Constraint: new_spent <= MAX_BUDGET - Reserve
        => 2.25*b <= MAX_BUDGET - Reserve - (spent - C) = F + C
        => b <= (F + C) / 2.25
    """
    if team.players_needed <= 0:
        # No more reserved slots needed — full remaining balance is available
        gross_balance = MAX_BUDGET - team.gross_spent
        if gross_balance <= 0:
            return 0
        if gross_balance >= team.highest_bid:
            return max(0, int((gross_balance + team.marquee_valuation) / (1 + MARQUEE_VALUATION_MULTIPLIER)))
        return max(0, int(gross_balance))
    reserve = (team.players_needed - 1) * RESERVE_PER_PLAYER
    gross_balance = MAX_BUDGET - reserve - team.gross_spent  # F in Excel
    if gross_balance <= 0:
        return 0

    if gross_balance >= team.highest_bid:
        # New highest bid is possible — apply multiplier protection
        max_bid = int((gross_balance + team.marquee_valuation) / (1 + MARQUEE_VALUATION_MULTIPLIER))
    else:
        # Cannot beat highest_bid — no uplift will occur — safe to bid up to F
        max_bid = int(gross_balance)

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
