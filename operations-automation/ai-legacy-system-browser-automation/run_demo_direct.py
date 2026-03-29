#!/usr/bin/env python3
"""
Run the onboarding browser automation directly — no Outlook needed.

Usage:
    export BROWSER_ID="legacy_system_automation_browser-NRBZEfhtru"
    export AWS_REGION="us-east-1"
    export CLOUDFRONT_DOMAIN="drjufmkun3xoa.cloudfront.net"
    eval "$(aws configure export-credentials --format env)"

    python3 run_demo_direct.py
"""

import os
import sys
import logging

# Add ai-browser-automation to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "ai-browser-automation"))

from email_parser import parse_onboarding_email
from onboarding_orchestrator import OnboardingOrchestrator
from onboarding_config import load_onboarding_config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---- Simulated email content (same as what you'd send) ----
EMAIL_SUBJECT = "NEW EMPLOYEE ORDER - Ron Smith - Senior Engineer Equipment Setup"
EMAIL_BODY = """Dear IT Team,

Please process the following equipment request for our new Senior Software Engineer.

Employee Details:
- Name: Ron Smith
- Position: Senior Software Engineer
- Department: Engineering
- Start Date: April 15, 2026
- Manager: Jane Williams

Equipment Requested:
1. Professional Laptop 16" - High-performance laptop for development work
2. Office 365 License - Productivity software suite

Budget Code: ENG-2026-Q2
Priority: High

Please ensure all equipment is ready before the employee's start date.

Best regards,
Human Resources
"""

def main():
    # Verify env vars
    for var in ["BROWSER_ID", "CLOUDFRONT_DOMAIN"]:
        if not os.environ.get(var):
            print(f"ERROR: {var} environment variable is not set")
            sys.exit(1)

    browser_id = os.environ["BROWSER_ID"]
    region = os.environ.get("AWS_REGION", "us-east-1")
    domain = os.environ["CLOUDFRONT_DOMAIN"]

    print("=" * 60)
    print("  Direct Browser Automation Demo")
    print("=" * 60)
    print(f"  Browser ID: {browser_id}")
    print(f"  Region:     {region}")
    print(f"  Portal:     https://{domain}")
    print("=" * 60)

    # Parse the email
    logger.info("Parsing email content...")
    request = parse_onboarding_email(EMAIL_SUBJECT, EMAIL_BODY)

    if hasattr(request, 'message'):
        # It's a ParseError
        print(f"ERROR: Failed to parse email: {request.message}")
        sys.exit(1)

    request.requester_email = "demo@example.com"

    logger.info(f"Employee: {request.employee.name}")
    logger.info(f"Position: {request.employee.position}")
    logger.info(f"Equipment items: {len(request.equipment)}")
    for i, item in enumerate(request.equipment, 1):
        logger.info(f"  {i}. {item.name} ({item.category})")

    # Load config
    config = load_onboarding_config()

    # Import AgentCore + Nova Act
    try:
        from bedrock_agentcore.tools.browser_client import browser_session
        from nova_act import NovaAct
        from nova_act.types.workflow import workflow
    except ImportError:
        print("ERROR: Missing dependencies. Install with:")
        print("  pip3 install bedrock-agentcore nova-act")
        sys.exit(1)

    WORKFLOW_NAME = "onboarding-email-workflow"

    @workflow(workflow_definition_name=WORKFLOW_NAME, model_id="nova-act-latest")
    def run_automation():
        with browser_session(region, identifier=browser_id) as client:
            ws_url, headers = client.generate_ws_headers()
            logger.info("Browser session started")
            logger.info(f"Live view: https://{region}.console.aws.amazon.com/bedrock-agentcore/builtInTools")

            starting_url = config.itsm_url
            logger.info(f"Opening: {starting_url}")

            with NovaAct(
                cdp_endpoint_url=ws_url,
                cdp_headers=headers,
                starting_page=starting_url,
            ) as nova:
                logger.info("Nova Act connected")

                orchestrator = OnboardingOrchestrator(
                    config, nova=nova, skip_ses_init=False
                )
                state = orchestrator.execute(request=request)

                if state.status == "completed":
                    logger.info(f"SUCCESS - Ticket: {state.ticket_id}")
                else:
                    logger.error(f"FAILED - {state.error}")

    logger.info("Starting browser automation...")
    run_automation()

if __name__ == "__main__":
    main()
