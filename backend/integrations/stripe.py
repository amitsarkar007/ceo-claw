import stripe
import os

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


async def create_stripe_product_link(startup_idea: dict) -> str | None:
    """
    Create a Stripe payment link for the generated product.
    This satisfies the Anyway track's 'commercialise the agent' requirement.
    """
    if not STRIPE_SECRET_KEY:
        return None

    idea = startup_idea or {}
    try:
        product = stripe.Product.create(
            name=idea.get("name", "AI Product"),
            description=idea.get("solution", "AI-powered solution")
        )

        price = stripe.Price.create(
            product=product.id,
            unit_amount=9900,  # £99/month in pence
            currency="gbp",
            recurring={"interval": "month"}
        )

        payment_link = stripe.PaymentLink.create(
            line_items=[{"price": price.id, "quantity": 1}]
        )

        return payment_link.url

    except Exception as e:
        print(f"Stripe product creation failed: {e}")
        return None
