# SuRaksha Safety Hub

Build a complete, polished, hackathon-ready web application prototype called “SuRaksha AI”.

PRODUCT NAME

SuRaksha AI

Tagline

Detect. Assess. Act.

One-line description

An AI-assisted, context-aware safety intelligence platform that assesses evolving safety situations, generates an explainable risk score, recommends appropriate actions, and enables rapid escalation to trusted contacts and authorized emergency services.

This application is being developed as a prototype for the Smart India Hackathon (SIH) under the domain of Women & Child Safety.

The prototype must look and behave like a serious real-world safety product, not like a generic AI chatbot or simple SOS application.

1. CORE PROBLEM

Women and children may encounter situations such as:

Online harassment

Cyberbullying

Blackmail

Deepfake or manipulated images

Stalking

Threatening messages

Sexual harassment

Physical danger

Repeated intimidation

The major problem is not only lack of emergency services.

The problem is that users often do not know:

How serious their situation is

What action they should take

Whether they should preserve evidence

Whether they should report the incident

Whether they should inform a trusted person

Whether they need emergency assistance

Existing emergency infrastructure such as 112 is valuable and should NOT be replaced.

SuRaksha should act as an intelligent safety decision-support and orchestration layer.

2. CORE PRODUCT PHILOSOPHY

The complete product workflow is:

DETECT → ASSESS → EXPLAIN → RECOMMEND → ESCALATE → DOCUMENT

The product should NOT claim that AI can scientifically or medically measure a person's internal emotional state.

Do NOT use the phrase:

“AI detects distress with X% accuracy.”

Instead use:

“AI-Assisted Situational Safety Risk Assessment”

The system assesses the situation, not the person's mental state.

3. MAIN SAFETY RISK MODEL

Create a transparent risk score from:

0–100

Risk levels:

0–25

🟢 LOW

26–50

🟡 MODERATE

51–75

🟠 HIGH

76–100

🔴 CRITICAL

The score should be based on structured factors:

Threat severity

Immediacy of danger

Repetition/frequency

Blackmail/coercion

Physical threat

Image-based abuse/deepfake

Stalking

User-reported fear/distress

Vulnerability/context

For the prototype, implement a deterministic mock risk engine.

The AI should interpret user text and map it into risk factors, but the final score should be calculated using a transparent scoring system.

Do NOT allow the LLM to arbitrarily generate a score.

Example:

Threat Severity: 25/30
Immediacy: 18/20
Repetition: 8/10
Blackmail: 15/15
Image Abuse: 8/10
User-reported distress: 7/15

Total: 81/100

Show the breakdown to the user.

4. IMPORTANT SAFETY PRINCIPLE

The AI must NOT independently decide to contact police.

Instead:

AI Analysis
→ Risk Engine
→ Recommended Response
→ User-controlled Emergency Escalation

For CRITICAL situations, make emergency options highly visible.

For immediate physical danger, show:

“If you are in immediate danger, contact emergency services now.”

The prototype can simulate emergency-service integration.

Do not make real emergency calls or messages.

5. TARGET USERS

Design the system for:

Women

For:

harassment

stalking

blackmail

deepfake abuse

physical threats

Children / Teenagers

For:

cyberbullying

blackmail

online threats

grooming indicators

image-based abuse

Parents / Guardians

For:

emergency notifications

incident awareness

trusted contact support

6. APPLICATION STRUCTURE

Create these main sections:

Dashboard

Assess Situation

AI Safety Assessment

Action Plan

Emergency Mode

Emergency Contacts

Incident Reports

Incident History

Safety Resources

Profile & Privacy Settings

Use a modern sidebar on desktop.

Use a mobile-friendly bottom navigation on smaller screens.

7. VISUAL DESIGN

Create a premium, trustworthy, modern safety-tech interface.

Design principles:

Clean

Minimal

Professional

Accessible

Government/SIH presentation quality

Mobile-first safety interaction

Strong visual hierarchy

Use:

White/light neutral backgrounds

Dark typography

Subtle gradients

Rounded cards

Soft shadows

Professional icons

Clear status indicators

Risk colors:

🟢 Green = Low / Safe
🟡 Yellow/Amber = Moderate
🟠 Orange = High
🔴 Red = Critical / Emergency

Use red only where genuinely necessary.

Do NOT make the whole interface red.

The emergency button must be visually dominant but professional.

Use smooth but subtle animations.

8. DASHBOARD

Create the main dashboard.

Header:

Good Evening, User

Subtitle:

Your proactive safety companion

Create a large safety status card:

CURRENT SAFETY STATUS

🟢

You are currently safe

“No active emergency detected.”

Then create three main action cards.

Card 1

Assess a Situation

“Not sure what to do? Tell SuRaksha what happened.”

Button:

Start Assessment

Card 2

Document an Incident

“Preserve important information and generate a structured report.”

Button:

Create Report

Card 3

Large emergency card:

🚨 I AM IN DANGER

“Activate emergency assistance.”

Button:

GET HELP NOW

Make this button available throughout the application.

Below show:

Recent Safety Activity

Example:

Deepfake Harassment
72/100
HIGH
17 Aug 2026

Bullying & Threat
84/100
CRITICAL
15 Aug 2026

Suspicious Contact
46/100
MODERATE
12 Aug 2026

Also show:

Emergency Contacts

Parent / Guardian
Friend
Trusted Contact

9. ASSESS SITUATION SCREEN

Create a guided workflow.

Heading:

What is happening?

Subtitle:

Tell SuRaksha what happened. You don't need to know what category it belongs to.

Show categories:

Online Harassment

Deepfake / Manipulated Image

Cyberbullying

Blackmail

Stalking

Physical Threat

Sexual Harassment

Something Else

Then:

Describe what happened

Large textarea.

Placeholder:

“Describe the situation in your own words…”

Example helper text:

“You can write naturally. SuRaksha will identify relevant safety indicators.”

Add:

Evidence

Buttons:

📷 Upload Screenshot
📎 Upload File
🔗 Add URL

Do not upload files to real external services in the prototype. Simulate file upload and display the filename.

Add optional questions:

Is anyone threatening you?

Yes
No
Not sure

Has this happened repeatedly?

Yes
No
Not sure

Do you feel that the situation could escalate?

Yes
No
Not sure

Then:

ANALYZE WITH SURAKSHA AI

10. DEMO SCENARIO

Create a prominent:

Try Demo Scenario

button.

When clicked, show three scenarios:

Scenario 1 — Deepfake + Blackmail

Text:

“Someone created a fake image of me and is threatening to share it publicly unless I do what they say. They have already sent it to two people.”

Expected:

HIGH/CRITICAL risk.

Scenario 2 — Cyberbullying

Text:

“Someone from school keeps sending threatening messages and says they will publish my photos if I block them.”

Expected:

CRITICAL.

Scenario 3 — Immediate Physical Danger

Text:

“Someone is following me and I am scared they may hurt me.”

Expected:

CRITICAL.

The demo scenarios should automatically populate the assessment screen.

11. AI PROCESSING SCREEN

When the user clicks Analyze, show a realistic animated analysis sequence.

Display:

SuRaksha AI is analyzing the situation…

Then:

✓ Understanding incident
✓ Identifying risk indicators
✓ Assessing severity
✓ Evaluating escalation risk
✓ Preparing recommended actions

After 2–3 seconds show the result.

12. AI SAFETY ASSESSMENT SCREEN

This is the most important screen in the application.

Show:

AI Safety Assessment

Large circular score:

82 / 100

🔴 CRITICAL RISK

Subtitle:

Immediate attention recommended

Then:

Why this score?

Example:

“The reported situation contains multiple indicators of potential escalation, including threats, blackmail and image-based abuse.”

Then:

Detected Risk Indicators

Show cards:

🔴 Threatening language
High

🔴 Blackmail / coercion
High

🔴 Image-based abuse
High

🟠 Repeated harassment
Medium

Then:

Risk Breakdown

Threat Severity
25 / 30

Immediacy
18 / 20

Repetition
8 / 10

Blackmail
15 / 15

Image Abuse
8 / 10

User-reported distress
8 / 15

Total:

82 / 100

Make this visually impressive.

Add an information tooltip:

“This is an AI-assisted situational risk assessment and is not a medical diagnosis.”

Buttons:

View Recommended Actions

Generate Incident Report

Get Emergency Help

13. ACTION PLAN SCREEN

Heading:

What should you do now?

Subtitle:

SuRaksha has prioritized the following actions based on the assessed risk.

Create action cards.

For high/critical scenarios:

1. Preserve Evidence

Save screenshots, URLs, messages and timestamps.

Button:

Mark as Done

2. Avoid Further Engagement

Do not respond to threats or coercion.

3. Report the Account / Content

Provide a generic reporting action.

4. Inform a Trusted Person

Show:

Notify Emergency Contact

5. Seek Appropriate Assistance

Show:

Cybercrime reporting

Emergency assistance

Trusted guardian

Local authorities where appropriate

Then show:

Recommended Escalation

For critical:

🔴

Immediate assistance may be appropriate.

Button:

GET EMERGENCY HELP

14. INCIDENT REPORT SCREEN

Create:

AI-Generated Incident Report

Show:

Incident ID
Date & Time
Incident Type
Risk Score
Risk Level

Then:

Incident Summary

Automatically generated summary.

Detected Indicators

List them.

Evidence

Show uploaded screenshots/files as mock cards.

Recommended Actions

List actions.

Escalation Recommendation

Show:

Critical — Immediate assistance recommended.

Buttons:

Save Report

Download PDF

Share Report

For the prototype, download can generate a realistic PDF or simulated document.

15. EMERGENCY MODE

Create a separate emergency interface.

It should feel different from normal application screens.

Heading:

🚨 Emergency Assistance

Subheading:

If you are in immediate danger, use this mode to quickly request help.

Show:

Emergency Options

Emergency Services

Police Assistance

Women Safety Assistance

Emergency Contacts

Also show:

Emergency Response Settings

☑ Notify emergency contacts

☑ Share current location

☑ Send incident information

☑ Send risk assessment

Then a huge button:

🚨 ACTIVATE EMERGENCY

When clicked, show a confirmation dialog:

Activate Emergency Response?

“This will notify your configured emergency contacts and initiate the selected emergency workflow.”

Buttons:

Cancel

Activate Emergency

16. EMERGENCY ACTIVATED SCREEN

After confirmation:

🚨 EMERGENCY MODE ACTIVE

Large status:

HELP REQUEST INITIATED

Show a live-looking timeline.

22:41:03
Emergency mode activated

22:41:04
Emergency contact notification initiated

22:41:05
Location sharing enabled

22:41:06
Incident information prepared

22:41:07
Assistance workflow initiated

Show cards:

Emergency Contact

✓ Notification Sent

Location

✓ Sharing Active

Incident Information

✓ Prepared

Risk Assessment

✓ 82/100 — CRITICAL

Add:

View Incident Report

and:

End Emergency Mode

Before ending emergency mode, require confirmation.

IMPORTANT:

This is only a prototype simulation. Do not actually call police, emergency services or send real messages.

17. EMERGENCY CONTACTS

Create:

My Emergency Contacts

Example cards:

Parent / Guardian

Relationship:
Parent

Phone:
+91 XXXXX XXXXX

Status:
Primary Contact

Trusted Friend

Relationship:
Friend

Phone:
+91 XXXXX XXXXX

Trusted Teacher

Relationship:
Teacher

Phone:
+91 XXXXX XXXXX

Button:

- Add Emergency Contact

Allow editing/deleting contacts in the prototype.

Settings:

☑ Notify during emergency
☑ Share location
☑ Send risk score
☑ Send incident report

18. INCIDENT HISTORY

Create:

Safety History

Use timeline/card layout.

Example:

Deepfake / Image Abuse

72/100
HIGH

17 Aug 2026

Status:
Report Generated

Bullying + Blackmail

84/100
CRITICAL

15 Aug 2026

Status:
Emergency Assistance Activated

Suspicious Contact

46/100
MODERATE

12 Aug 2026

Status:
Guidance Provided

Clicking an incident opens its detailed report.

19. SAFETY RESOURCES

Create:

Safety Resource Center

Categories:

Women Safety

Guidance for harassment, stalking and threats.

Child Safety

Guidance for cyberbullying, online threats and trusted-adult escalation.

Cyber Harassment

Evidence preservation and reporting guidance.

Deepfake / Image Abuse

What to do when manipulated content is created or distributed.

Bullying

Immediate steps and trusted-adult guidance.

Emergency Assistance

When to seek immediate help.

Do not provide unsupported legal advice.

Use links/placeholders for official services.

20. PROACTIVE SAFETY FEATURE

Because the project is called a proactive safety system, include a:

Safety Check-In

feature.

User can activate:

“I'm going somewhere and want a safety check-in.”

Example:

Duration:
30 minutes

Emergency contact:
Parent

If the user does not complete the check-in, show:

Safety check-in missed

Then ask:

“Are you safe?”

Buttons:

I'm Safe

I Need Help

This should be a prototype simulation.

This feature is important because it makes the product genuinely more proactive than a normal SOS application.

21. AI ASSISTANT

Create a contextual AI assistant named:

SuRaksha AI

It should NOT look like a generic ChatGPT clone.

Use it as a guided safety assistant.

Example:

User:

“Someone created my fake photo and is threatening to send it to everyone.”

AI:

“I can help you assess the situation. I need a few details to determine the appropriate response.”

Question:

“Has the content already been shared publicly?”

Options:

Yes
No
I don't know

Question:

“Has the person threatened you with physical harm?”

Yes
No

Question:

“Has this happened repeatedly?”

Yes
No

Then update the risk factors.

22. AI OUTPUT STRUCTURE

The AI response should always follow this structure:

Situation

What the system understood.

Risk Level

LOW / MODERATE / HIGH / CRITICAL

Risk Score

0–100

Detected Factors

Threat
Blackmail
Harassment
Physical danger
Image abuse
etc.

Why

Short explanation.

Recommended Actions

Prioritized steps.

Escalation

Whether emergency assistance should be considered.

Do not allow the AI to produce unsupported legal claims.

23. HYBRID AI + RULE ENGINE

Implement the prototype architecture conceptually as:

User Input
↓
AI/NLP interpretation
↓
Extract structured risk factors
↓
Deterministic risk engine
↓
Risk Score
↓
Recommendation engine
↓
AI-generated explanation

The deterministic scoring engine should be easy to modify.

Create a reusable function/component for risk calculation.

Example:

Threat Severity:
0–30

Immediacy:
0–20

Repetition:
0–10

Blackmail:
0–15

Image Abuse:
0–10

Vulnerability:
0–10

User-reported distress:
0–5

Total:
100

Allow weights to be configured in one place.

24. PRIVACY & SECURITY

Create a Privacy section.

Display:

Your Safety Data

“Your incident information should only be used for safety assistance and reporting workflows.”

Show controls:

Delete incident

Delete evidence

Clear incident history

Manage emergency contacts

Location sharing settings

Data sharing settings

Add:

Privacy by Design

Minimal data collection

User-controlled sharing

Explicit emergency consent

Role-based access in future implementation

Encryption in production

Do not claim encryption is implemented unless it actually is.

25. PROFILE & SETTINGS

Create:

Name
Age category
Emergency preferences
Location-sharing preference
Notification settings
Privacy settings

For child mode, provide:

Guardian Mode

A future-ready section showing:

“Guardian-linked safety profile”

But keep this as a prototype UI rather than implementing invasive monitoring.

26. DATA MODEL

Prepare the frontend/backend architecture for the following entities:

users

id
name
email
role
created_at

emergency_contacts

id
user_id
name
relationship
phone
priority
notification_enabled

incidents

id
user_id
type
description
risk_score
risk_level
created_at
status

risk_factors

id
incident_id
factor
severity
score

evidence

id
incident_id
file_name
file_type
uploaded_at

emergency_events

id
user_id
incident_id
activated_at
location_status
contact_notification_status
emergency_status

safety_checkins

id
user_id
start_time
expiry_time
status
emergency_contact_id

Use Supabase-compatible structure if backend integration is enabled.

27. DEMO DATA

Prepopulate the prototype with realistic demo data.

Use:

Incident 1

Deepfake / Image Abuse

Risk:
72/100

HIGH

Incident 2

Cyberbullying + Blackmail

Risk:
84/100

CRITICAL

Incident 3

Suspicious Contact

Risk:
46/100

MODERATE

Do not use real people's personal information.

28. GOVERNMENT SERVICE INTEGRATION UI

Create an “Emergency & Official Services” section.

Show:

112 Emergency Response

Description:
“Nationwide emergency response service.”

Button:
“Open Emergency Assistance”

National Cyber Crime Reporting

Description:
“Official cybercrime reporting pathway.”

Button:
“Report Cybercrime”

Trusted Contacts

Description:
“People you have configured to receive emergency notifications.”

Important:

These should be represented as integration pathways.

Do not claim that direct API integration with government services exists unless an actual API is configured.

29. MAP / LOCATION

Create a location card in Emergency Mode.

Display:

Current Location

“Location sharing enabled”

Use a mock map or map component.

For prototype purposes, use a generic simulated location.

Do not expose real user location.

30. MOBILE EMERGENCY EXPERIENCE

This is extremely important.

On mobile:

Keep emergency button visible

Use large touch targets

Minimize text

Make emergency activation accessible within one or two interactions

Show emergency status clearly

Create a persistent emergency action button in mobile navigation.

31. ERROR AND EDGE CASES

Implement UI states for:

AI unavailable

Show:

“AI analysis is temporarily unavailable. You can still access emergency assistance and safety resources.”

No internet

Show:

“Connection unavailable. Emergency options remain visible.”

Missing emergency contacts

Show:

“You haven't configured an emergency contact yet.”

Button:

“Add Emergency Contact”

Low confidence AI analysis

Show:

“We need more information to confidently assess this situation.”

Then ask additional questions.

32. IMPORTANT UX RULE

Never bury the emergency option behind the AI.

The user must always be able to access:

🚨 GET HELP

even if AI analysis fails.

33. SIH DEMO FLOW

The prototype must support this exact presentation flow:

Step 1

Open Dashboard.

Step 2

Click:

Assess a Situation

Step 3

Select:

Deepfake / Manipulated Image

Step 4

Load demo scenario:

“Someone created a fake image of me and is threatening to share it publicly unless I comply.”

Step 5

Click:

Analyze with SuRaksha AI

Step 6

Show AI processing.

Step 7

Display:

82 / 100

CRITICAL RISK

Step 8

Show detected factors.

Step 9

Show transparent score breakdown.

Step 10

Show recommended actions.

Step 11

Generate incident report.

Step 12

Click:

🚨 GET EMERGENCY HELP

Step 13

Show emergency confirmation.

Step 14

Activate emergency mode.

Step 15

Show:

✓ Emergency contact notified
✓ Location sharing activated
✓ Incident information prepared
✓ Assistance workflow initiated

This should take approximately 2–3 minutes during a live SIH demo.

34. PRODUCT POSITIONING

The interface should communicate:

Existing systems answer:

“Where do I get help?”

SuRaksha answers:

“What is happening, how serious is it, what should I do now, and when should I escalate?”

Do not position SuRaksha as a replacement for 112 or government services.

Position it as:

An intelligent safety orchestration layer.

35. TECHNICAL QUALITY

Write clean, modular TypeScript/React code.

Create reusable components:

RiskScore

RiskBreakdown

RiskIndicator

EmergencyButton

EmergencyStatus

EmergencyContactCard

IncidentCard

IncidentReport

ActionRecommendation

AIAnalysisPanel

SafetyCheckIn

EmergencyTimeline

Avoid duplicated code.

Use proper loading, error and empty states.

Make every important button functional.

36. FINAL SUCCESS CRITERIA

The prototype is successful only if a judge can understand the complete concept within 2 minutes.

The judge should immediately understand:

What problem is being solved.

Why existing SOS systems alone are insufficient.

How AI understands the situation.

How the risk score is calculated.

Why the score is explainable.

What action the user should take.

How emergency escalation works.

How emergency contacts are notified.

How incidents are documented.

How the system can integrate with existing government infrastructure.

The final application should feel like a realistic national-scale safety platform prototype rather than a collection of unrelated AI features.

FINAL PRODUCT MESSAGE

Display this somewhere prominent in the application:

“Don't wait for a crisis to become an emergency.”

And:

“SuRaksha AI — Detect. Assess. Act.”

Build the entire prototype around this principle.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2a071ce2-bf73-4640-b586-57d491f70bf7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
