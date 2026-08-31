"use client";

const SAMPLE_CXML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE cXML SYSTEM "http://xml.cxml.org/schemas/cXML/1.2.014/cXML.dtd">
<cXML timestamp="2026-08-15T10:30:00-07:00"
      payloadID="7800459912.20260815.AN99000010001-T">
  <Header>
    <From>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN99000020002-T</Identity>
      </Credential>
    </From>
    <To>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN99000010001-T</Identity>
      </Credential>
    </To>
    <Sender>
      <Credential domain="AribaNetworkUserId">
        <Identity>AN99000020002-T</Identity>
      </Credential>
    </Sender>
  </Header>
  <Request deploymentMode="test">
    <OrderRequest>
      <OrderRequestHeader orderID="7800459912"
                          orderDate="2026-08-15T00:00:00-07:00"
                          type="new">
        <Total>
          <Money currency="USD">12750.00</Money>
        </Total>
        <ShipTo>
          <Address addressID="HQ_US_01">
            <Name xml:lang="en">Acme Manufacturing Corp</Name>
            <PostalAddress>
              <Street>200 Main Street</Street>
              <City>Chicago</City>
              <State>IL</State>
              <PostalCode>60601</PostalCode>
              <Country isoCountryCode="US">United States</Country>
            </PostalAddress>
          </Address>
        </ShipTo>
        <PaymentTerm payInNumberOfDays="30"/>
      </OrderRequestHeader>
      <ItemOut lineNumber="1" quantity="10">
        <ItemID>
          <SupplierPartID>HW-ROUTER-900</SupplierPartID>
          <BuyerPartID>NET-RT-900</BuyerPartID>
        </ItemID>
        <ItemDetail>
          <UnitPrice><Money currency="USD">850.00</Money></UnitPrice>
          <Description xml:lang="en">Enterprise Network Router - Model 900</Description>
          <UnitOfMeasure>EA</UnitOfMeasure>
        </ItemDetail>
      </ItemOut>
    </OrderRequest>
  </Request>
</cXML>`;

function highlight(cxml: string): string {
  return cxml
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // XML declaration
    .replace(/(&lt;\?xml[^?]*\?&gt;)/g, '<span class="cxml-comment">$1</span>')
    // DOCTYPE
    .replace(/(&lt;!DOCTYPE[^&]*&gt;)/g, '<span class="cxml-comment">$1</span>')
    // Closing tags
    .replace(/(&lt;\/)([\w:]+)(&gt;)/g, '<span class="cxml-tag">$1$2$3</span>')
    // Self-closing tags with attributes
    .replace(/(&lt;)([\w:]+)((?:\s[\w:]+="[^"]*")*)\s*(\/)(&gt;)/g,
      '<span class="cxml-tag">$1$2</span>$3<span class="cxml-tag">$4$5</span>')
    // Opening tags with attributes
    .replace(/(&lt;)([\w:]+)((?:\s[\w:]+="[^"]*")*)(&gt;)/g,
      '<span class="cxml-tag">$1$2</span>$3<span class="cxml-tag">$4</span>')
    // Attributes name="value"
    .replace(/([\w:]+)=("([^"]*)")/g,
      '<span class="cxml-attr">$1</span>=<span class="cxml-value">$2</span>');
}

interface Props {
  cxml?: string;
  maxHeight?: string;
  title?: string;
}

export default function CXMLViewer({ cxml = SAMPLE_CXML, maxHeight = "320px", title }: Props) {
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--sap-border)" }}>
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b"
             style={{ background: "var(--sap-shell)", borderColor: "transparent" }}>
          <span className="text-xs font-semibold text-white">{title}</span>
          <span className="text-xs text-white/50 font-mono">cXML</span>
        </div>
      )}
      <div
        className="overflow-auto p-4 text-xs font-mono leading-relaxed"
        style={{
          background: "#1B2533",
          color: "#E0E8F0",
          maxHeight,
          tabSize: 2,
        }}
        dangerouslySetInnerHTML={{ __html: highlight(cxml) }}
      />
    </div>
  );
}
