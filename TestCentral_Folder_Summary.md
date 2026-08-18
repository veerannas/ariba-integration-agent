# Test Central — Complete Knowledge Base
**SAP Business Network · TPS Warehouse · Integration · August 2026**  
Sources: Integration > Test Central · TPS Transformation > Integration & Catalog > Test Central

---

## 1. What Is Test Central?

Test Central is a safe, test-only environment inside SAP Business Network (SBN) where suppliers can generate Purchase Orders (POs) on behalf of the buyer and send back their response documents — Order Confirmation, Advance Ship Notice, Invoice, Credit Memo — to validate their integration before the buyer needs to be involved.

**It is the standard testing approach for all SAP SBN Integration Projects.** One-time setup per buyer per PO type. Reused for every future supplier.

| What | Detail |
|---|---|
| Platform | SAP Managed Gateway for Spend & Network — Admin Area → Test Central |
| Purpose | Suppliers test independently without waiting for buyer to generate POs |
| Coverage | ~80–85% of testing completed without buyer involvement |
| Document flow | Supplier generates Test PO → sends OC/ASN/INV → automated validation |
| ERP impact | Zero — Test POs do not post to buyer ERP (non-ERP-generated documents) |
| Setup effort | One-time per buyer per PO type; SAP integration resource owns setup |
| Reuse | Same Test Scenarios reused for all future suppliers under the same buyer |

---

## 2. SharePoint Folder Structure

### 2.1 Integration > Test Central (25 files)
*Path: TPS Warehouse → Integration → Test Central*

| Folder | File | Type | Updated |
|---|---|---|---|
| Buyer Facing | Buyer Test Central FAQ.pdf | PDF 2p | Mar 2026 |
| Buyer Facing | Buyer Value Prop - Test Central.pptx | PPTX | Aug 2026 |
| Buyer Facing | How to Enable Managed Gateway.pdf | PDF | Mar 2026 |
| Buyer Facing / Email Templates | Buyer Opt-Out from TC.oft | Email template | Apr 2026 |
| Buyer Facing / Email Templates | Test Central Value Prop.oft | Email template | Apr 2026 |
| Buyer Facing / Email Templates | Update on Testing Approach.oft | Email template | Mar 2026 |
| Internal / Functional Docs | Internal Test Central Instructions.pptx | PPTX | Jun 2026 |
| Internal / Access for TC Set Up | How to Access Admin Area.pdf | PDF 1p | Mar 2026 |
| Internal / Access for TC Set Up | How to Access TC Admin Area.pdf | PDF 2p | Mar 2026 |
| Internal / TC Set Up Tracking | BUYER_TC_Scenario_Tracker_Template.xlsx | Excel template | Mar 2026 |
| Internal / TC Set Up Tracking | How to Use Scenario Tracker.pdf | PDF 4p | Mar 2026 |
| Internal / TC Set Up Tracking | Test Central Active Buyers 4.2026.xlsx | Excel | Jun 2026 |
| Internal / Technical Setup | Creating Test Cases and Scenarios.pdf | PDF 10p | Mar 2026 |
| Internal / Technical Setup | How to Prep PO Examples for TC.pdf | PDF 4p | Mar 2026 |
| Internal / Technical Setup | Instructions for Sending POs on behalf of Buyer.docx | DOCX | Mar 2026 |
| Internal / Technical Setup | Quick Guide for Troubleshooting Scenarios.pdf | PDF 1p | Mar 2026 |
| Internal / Technical Setup | Test Central Setup Checklist.pdf | PDF 5p | Mar 2026 |
| Internal / Talk Tracks | Buyer Objections and Responses.pdf | PDF 2p | Mar 2026 |
| Internal / Talk Tracks | Supplier Objections and Responses.pdf | PDF 2p | Mar 2026 |
| Internal / Talk Tracks | Talking Points for Introducing TC.pdf | PDF 1p | Mar 2026 |
| Internal / Talk Tracks | TC Buyer & Supplier Objections.docx | DOCX | Mar 2026 |
| Internal / Training Recordings | Training Session Recording Links.docx | DOCX | Apr 2026 |
| Supplier Facing | Supplier How To Use Guide – TC.pptx | PPTX | Jul 2026 |
| Supplier Facing | Supplier TC Cheat Sheet.pdf | PDF 3p | Mar 2026 |
| Supplier Facing | Supplier Test Central FAQ.pdf | PDF 3p | Mar 2026 |

### 2.2 TPS Transformation > Integration & Catalog > Test Central (13 files)
*Path: TPS Transformation public → TPS → Integration & Catalog → Test Central*

| File | Type | Description |
|---|---|---|
| 00 Instructions.docx | DOCX | Facilitator playbook — session schedule and video sequencing for 3-week training |
| 01a IntegrationTransformationPhaseOneTraining.mp4 | Video | Phase 1 integration transformation overview recording |
| 01b IntegrationTransformationPhaseOneTraining.pptx | PPTX | Phase 1 presentation deck with speaker notes |
| 02a Part 1_TPS Transformation.mp4 | Video | Test Central Part 1 training recording |
| 02b Test Central Part 1_TPS Transformation.pptx | PPTX | Part 1 slides |
| 03a Test Central Part 2.mp4 | Video | Test Central Part 2 training recording |
| 03b Test Central Functional Setup Guide.pptx | PPTX | Functional setup guide presentation |
| 04a Test Central Part 3 Training.mp4 | Video | Test Central Part 3 recording |
| 04b Test Central Part 3 Training Deck.pptx | PPTX | Part 3 slides |
| 04c DEMO1_BuyerTCTrackerandEditingcXMLDemo.mp4 | Video demo | Demo: using Buyer TC Tracker and editing cXML |
| 04d DEMO2_CreatingTestCaseandScenarioinTC.mp4 | Video demo | Demo: creating Test Case and Test Scenario in TC |
| 04e DEMO3_confirmscenariosATlastracking.mp4 | Video demo | Demo: confirming scenarios at Atlas and tracking |
| 04f Test Central Setup Checklist.pdf | PDF 5p | Same setup checklist — distributed as training handout |

---

## 3. Buyer Facing Documents

### Buyer Test Central FAQ (2 pages)

| Question | Summary Answer |
|---|---|
| What is Test Central? | Safe test-only SBN environment where suppliers generate test POs and validate docs |
| Why do suppliers send POs? | Removes dependency on buyer-generated POs; suppliers test on their own schedule |
| Does enabling TC change my connection? | No — existing connections and ERP integrations remain unchanged |
| Will TC send anything to our ERP? | No — Test POs are non-ERP-generated and do not post to buyer ERP |
| How much testing does TC cover? | ~85% — only final E2E test requires buyer involvement |
| What is the benefit to us? | Long-term efficiency; reduced workload; 6 weeks → 3 weeks; fewer escalations |
| What is expected from us? | 3 tasks: enable Managed Gateway, confirm PO types, provide one PO example per type |

### Email Templates (3 Outlook .oft files)

| Template | Use When |
|---|---|
| Buyer Opt-Out from TC.oft | Buyer declines to use Test Central — documents the decision |
| Test Central Value Prop.oft | Introducing Test Central to a buyer for the first time |
| Update on Testing Approach.oft | Project-level communication updating buyer on testing approach |

---

## 4. Internal Guides and Documents

### Test Central Setup Checklist (5 pages) — Master workflow

| Phase | Key Steps |
|---|---|
| Pre-Setup Verification | Confirm buyer approves TC; confirm/enable Managed Gateway (Test+Prod); check if scenarios already exist in US & EU; identify PO types on kickoff; obtain and edit cXML PO samples |
| Access TC Admin | Log in to Managed Gateway → Admin Area → Test Central → Test Case Repository + Test Scenarios |
| Create Test Cases (repeat per PO type) | Name format: [BUYER] [REGION] [PO TYPE]; Document Type = OrderRequest or ChangeOrderRequest; upload edited cXML; mark Active; set deploymentMode=test |
| Create Test Scenarios (repeat per PO type) | Link Test Cases; set Customer = buyer ANID; configure Doc Characteristics (9 modifiable fields); do NOT mark Mandatory; replicate to US & EU data centers |
| Supplier Visibility Validation | Log in as supplier; open Test Central; create Test Script; confirm scenarios appear and are selectable |
| Tracking & Documentation | Update Buyer_TC_Scenario_Tracker; save to CPR → Integration Kit → Test Central folder; add notes to Atlas SI/BSSI/BRP records |

**9 Standard Modifiable Doc Characteristics:** OrderHeaderShipToAddressID, OrderHeaderBillToAddressID, BuyerPartID, SupplierPartID, ItemQuantity, ItemUnitPrice, ItemUnitOfMeasure, ItemDescription, RequestedDeliveryDate

### Creating Test Cases and Scenarios (10 pages)

| Scenario Type | Document Type in TC | Key Configuration |
|---|---|---|
| Standard PO | OrderRequest | 9 Doc Characteristics all set Modifiable |
| Change PO | ChangeOrderRequest | Requires original PO Test Case as Parent; same Doc Characteristics |
| Cancel PO | ChangeOrderRequest | Parent = original PO Test Case; Doc Characteristics: only Order Operation = delete (not Modifiable) |
| Multi-version Change | ChangeOrderRequest | For 3rd+ versions: Parent Doc Type = ChangeOrderRequest (prior version) |

### How to Prep PO Examples for TC (4 pages)

| Remove / Replace | Keep |
|---|---|
| payloadID → #PAYLOADID# | PO structure and all business fields |
| Header credentials (From/To/Sender) → variables | Line items (generic descriptions OK) |
| orderDate, orderID → #DATETIME#, #DOCUMENTID# | ShipTo address |
| deploymentMode="production" → "test" | UOM, pricing, item categories |
| All supplier-specific names/addresses | Requested delivery dates (extend to far future) |
| PO numbers, agreement IDs, document IDs | PO type indicators and special fields |

### BUYER_TC_Scenario_Tracker_Template.xlsx
Three tabs: (1) **Test Scenarios** — scenario name, sample doc ref, description (must match TC exactly); (2) **PO Modifiable Fields** — which of 9 fields are modifiable per scenario; (3) **POs Loaded to TC** — all cXML POs loaded with version notes. Save to buyer CPR → Integration Kit → Test Central folder.

### Quick Guide for Troubleshooting Scenarios (1 page)

| Check | Action |
|---|---|
| Scenarios inactive | Mark Test Cases and Test Scenarios as Active |
| Wrong buyer | Verify ANID is correct on the Test Scenario |
| Wrong data center | Ensure scenarios deployed to both US and EU data centers |
| Missing project | Log in as supplier → verify Managed Gateway project exists for this buyer |
| Project set to "All" | Recreate project with same connection, set Customer to specific buyer |
| Still missing | Contact: Jessica Roth / Sumedha Gupta (NAMER/LAC) · Dean Worth (APAC/EMEA) |

---

## 5. Talk Tracks — Objections & Responses

### Buyer Objections

| Objection | Response |
|---|---|
| I cannot approve using TC | Offer documentation + schedule a demo call for internal team |
| We do not want suppliers sending POs on our behalf | All activity stays in test environment; never reaches your ERP |
| We have been onboarding without TC | TC enhances the process — less coordination, faster timelines |
| Suppliers will not use it correctly | SAP guides the supplier; automated feedback resolves issues without buyer |
| We need visibility | All POs visible in SBN Test Account; buyer can be as involved as desired |
| Will this create more work for us? | No — SAP only needs Managed Gateway enabled + PO cXML examples |

### Supplier Objections

| Objection | Response |
|---|---|
| Extra work for our technical team | Less work — ready-made PO templates + automated validation feedback |
| What if we impact the buyer? | TC validates before anything reaches production |
| We have onboarded without TC before | TC removes bottleneck of waiting for buyer PO availability |
| No time to learn a new tool | Lightweight; SAP provides clear instructions; ~2 week learning curve |
| Test POs will not match real buyer POs | Scenarios built from actual buyer PO samples — structurally identical |
| Buyers should control testing | Buyers still control scope and final E2E validation; governance unchanged |
| What if we need help? | SAP stays engaged throughout; automated validations identify issues immediately |

---

## 6. Supplier Facing Documents

### Supplier TC Cheat Sheet — 5-Step Workflow

| Step | Action | Key Point |
|---|---|---|
| 1 | Generate and send Test PO in Test Central | PO flows via Default or Custom Order Routing; line items editable |
| 2 | Process the PO in your system | Receive exactly as you would a real buyer PO |
| 3 | Send back required documents | OC, ASN, Invoice, Credit Memo — as confirmed on kickoff |
| 4 | Track progress in Test Plan | Mark each scenario; SAP and buyer review results |
| 5 | Repeat if documents fail | Normal — unlimited retries, no downtime, no waiting on buyer |

### Supplier Test Central FAQ — Key Points (14 questions)

| Question | Answer Summary |
|---|---|
| Prior testing with another buyer counts? | No — each buyer has unique rules; must test buyer-specific scenarios |
| Does TC affect production? | No — everything stays in test environment |
| Are Test POs real? | Look and behave like real POs but do not post to buyer ERP |
| How do I know if docs passed? | TC gives automated status — must be well-formed, valid cXML/EDI, aligned with buyer SBN rules |
| How many retries allowed? | Unlimited — test as many cycles as needed |
| Is Managed Gateway required? | Yes |
| Is E2E testing still needed? | Yes — at the very end, buyer sends at least one PO from their ERP |
| How long does testing take? | Most suppliers complete in ~2 weeks testing independently |

---

## 7. TPS Transformation Training Series

*3-session training series delivered March 2026*

| Session | Date | Content | Demos |
|---|---|---|---|
| Session 1 | Mar 16 | Phase 1 Integration Transformation overview + TC Part 1 | None |
| Session 2 | Mar 23 | Test Central Part 2 — functional setup walkthrough | None |
| Session 3 | Mar 30 | Test Central Part 3 — hands-on setup | 3 demos (see below) |

**3 Demo Recordings:**
- **DEMO 1** — Buyer TC Tracker and editing cXML: populate scenario tracker and edit buyer PO into reusable template
- **DEMO 2** — Creating Test Case and Scenario in TC: live Admin Area walkthrough
- **DEMO 3** — Confirm scenarios at Atlas and tracking: verify supplier visibility and update Atlas records

---

## 8. Connection to Ariba Integration Agent (AIA)

| Test Central Activity | AIA / AI2E Automation |
|---|---|
| Buyer provides cXML PO example per PO type | AIA Transaction Retrieval captures these via portal scraping or network capture |
| SAP creates Test Cases from PO samples | AI2E Scenario Generator creates 35 test variants from one retrieved PO |
| 9 modifiable Doc Characteristics fields | AI2E mutates these same 16 CIG-modifiable fields when generating variants |
| Prep PO examples: remove supplier data, set deploymentMode=test | AIA cXML Anonymizer handles data removal; engine sets test mode automatically |
| Documents must pass SBN transaction rules | AIA Troubleshooter diagnoses OC-*, CIG-PLT-* errors during testing |
| Track progress in Buyer_TC_Scenario_Tracker | AI2E generates guide rows per document mapping to Test Plan scenarios |
| Replicate scenarios to US & EU data centers | Future AIA phase: automate scenario submission via Test Central Admin API |

---

*— End of Document —*
