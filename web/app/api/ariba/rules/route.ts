import { NextResponse } from "next/server";

const RULES = [
  { id: "RULE-001", name: "Multi-Line Split",        description: "When a single-item PO exceeds quantity threshold, split into multiple lines",   trigger: "ItemOut.quantity > 10",                              action: "split_into_equal_lines" },
  { id: "RULE-002", name: "Supplier Part Fallback",  description: "If SupplierPartID is missing, use BuyerPartID with prefix mapping",             trigger: "ItemOut/ItemID/SupplierPartID is empty",             action: "map_buyer_to_supplier"  },
  { id: "RULE-003", name: "Ad-hoc Ship-To Detection",description: "Addresses with ADBUYER prefix are ad-hoc and require special handling",         trigger: "ShipTo/Address@addressID starts with 'ADBUYER'",     action: "flag_adhoc_address"     },
  { id: "RULE-004", name: "Currency Validation",     description: "Validate that PO currency matches supplier accepted currencies",                 trigger: "always",                                             action: "validate_currency"      },
  { id: "RULE-005", name: "Control Key - No OC",     description: "When control key indicates no Order Confirmation needed",                       trigger: "OrderRequestHeader@controlKey == 'NO_OC'",           action: "skip_confirmation"      },
];

export async function GET() {
  return NextResponse.json({ success: true, rules: RULES, count: RULES.length });
}
