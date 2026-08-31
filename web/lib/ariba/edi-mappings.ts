// EDI X12 850 ↔ cXML OrderRequest bidirectional field mappings
export interface EDIMapping {
  cxmlPath: string;
  cxmlElement: string;
  ediSegment: string;
  ediElement: string;
  description: string;
  required: boolean;
  example: string;
}

export const EDI_MAPPINGS: EDIMapping[] = [
  // Header
  { cxmlPath: "OrderRequestHeader@orderID",        cxmlElement: "OrderRequestHeader",  ediSegment: "BEG", ediElement: "BEG03", description: "Purchase Order Number",    required: true,  example: "7800459912"      },
  { cxmlPath: "OrderRequestHeader@orderDate",       cxmlElement: "OrderRequestHeader",  ediSegment: "BEG", ediElement: "BEG05", description: "PO Date",                  required: true,  example: "20260815"        },
  { cxmlPath: "OrderRequestHeader@type",            cxmlElement: "OrderRequestHeader",  ediSegment: "BEG", ediElement: "BEG01", description: "Transaction Purpose Code", required: true,  example: "00 (Original)"   },
  { cxmlPath: "Total/Money",                        cxmlElement: "Money",               ediSegment: "AMT", ediElement: "AMT02", description: "Total PO Amount",          required: true,  example: "12750.00"        },
  { cxmlPath: "Total/Money@currency",               cxmlElement: "Money@currency",      ediSegment: "CUR", ediElement: "CUR02", description: "Currency Code",            required: true,  example: "USD"             },
  { cxmlPath: "PaymentTerm@payInNumberOfDays",      cxmlElement: "PaymentTerm",         ediSegment: "ITD", ediElement: "ITD05", description: "Net Payment Days",         required: false, example: "30"              },
  // Ship-To
  { cxmlPath: "ShipTo/Address@addressID",           cxmlElement: "Address",             ediSegment: "N1",  ediElement: "N104",  description: "Ship-To Address ID",       required: false, example: "HQ_US_01"        },
  { cxmlPath: "ShipTo/Address/Name",                cxmlElement: "Name",                ediSegment: "N1",  ediElement: "N102",  description: "Ship-To Name",             required: true,  example: "Acme Mfg Corp"   },
  { cxmlPath: "ShipTo/Address/Street",              cxmlElement: "Street",              ediSegment: "N3",  ediElement: "N301",  description: "Ship-To Street",           required: true,  example: "200 Main Street" },
  { cxmlPath: "ShipTo/Address/City",                cxmlElement: "City",                ediSegment: "N4",  ediElement: "N401",  description: "Ship-To City",             required: true,  example: "Chicago"         },
  { cxmlPath: "ShipTo/Address/State",               cxmlElement: "State",               ediSegment: "N4",  ediElement: "N402",  description: "Ship-To State",            required: false, example: "IL"              },
  { cxmlPath: "ShipTo/Address/PostalCode",          cxmlElement: "PostalCode",          ediSegment: "N4",  ediElement: "N403",  description: "Ship-To ZIP",              required: false, example: "60601"           },
  // Line items
  { cxmlPath: "ItemOut@lineNumber",                 cxmlElement: "ItemOut",             ediSegment: "PO1", ediElement: "PO101", description: "Line Item Number",         required: true,  example: "1"               },
  { cxmlPath: "ItemOut@quantity",                   cxmlElement: "ItemOut",             ediSegment: "PO1", ediElement: "PO102", description: "Ordered Quantity",         required: true,  example: "10"              },
  { cxmlPath: "ItemDetail/UnitOfMeasure",           cxmlElement: "UnitOfMeasure",       ediSegment: "PO1", ediElement: "PO103", description: "Unit of Measure",          required: true,  example: "EA"              },
  { cxmlPath: "ItemDetail/UnitPrice/Money",         cxmlElement: "Money",               ediSegment: "PO1", ediElement: "PO104", description: "Unit Price",               required: true,  example: "850.00"          },
  { cxmlPath: "ItemID/SupplierPartID",              cxmlElement: "SupplierPartID",      ediSegment: "PO1", ediElement: "PO107", description: "Supplier Part Number",     required: false, example: "HW-ROUTER-900"   },
  { cxmlPath: "ItemID/BuyerPartID",                 cxmlElement: "BuyerPartID",         ediSegment: "PO1", ediElement: "PO109", description: "Buyer Part Number",        required: false, example: "NET-RT-900"      },
  { cxmlPath: "ItemDetail/Description",             cxmlElement: "Description",         ediSegment: "PID", ediElement: "PID05", description: "Item Description",         required: false, example: "Network Router"  },
];
