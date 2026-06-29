export type DocumentType =
  | 'nda'
  | 'performance_agreement'
  | 'commission_form'
  | 'territory_letter'
  | 'offer_letter';

export interface DocumentData {
  type: DocumentType;
  repName: string;
  repEmail: string;
  territory?: string;
  subterritory?: string;
  date: string;
  // NDA fields
  companyName?: string;
  ndaTermMonths?: number;
  // Performance Agreement fields
  callsPerDay?: number;
  meetingsPerWeek?: number;
  dealsPerMonth?: number;
  reviewDate?: string;
  directorName?: string;
  // Commission Form fields
  commissionRate?: string;
  paymentSchedule?: string;
  // Territory Letter fields
  schoolCount?: number;
  zone?: string;
  assignedDirector?: string;
  effectiveDate?: string;
  // Offer Letter fields
  position?: string;
  startDate?: string;
  compensation?: string;
  reportsTo?: string;
}

export function generateDocument(data: DocumentData): string {
  switch (data.type) {
    case 'nda':
      return generateNDA(data);
    case 'performance_agreement':
      return generatePerformanceAgreement(data);
    case 'commission_form':
      return generateCommissionForm(data);
    case 'territory_letter':
      return generateTerritoryLetter(data);
    case 'offer_letter':
      return generateOfferLetter(data);
    default:
      return generateFallback(data);
  }
}

function documentShell(title: string, bodyContent: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #0a0a0f;
      color: #e2e8f0;
      font-family: 'Helvetica Neue', Arial, 'Arial Black', Impact, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px 60px;
      -webkit-font-smoothing: antialiased;
    }
    .document-header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 40px;
      text-align: center;
    }
    .document-header .logo {
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: #3b82f6;
      margin-bottom: 12px;
    }
    .document-header h1 {
      font-size: 28px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #ffffff;
      text-transform: uppercase;
    }
    .document-header .subtitle {
      font-size: 13px;
      color: #64748b;
      margin-top: 6px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    h2 {
      font-size: 18px;
      font-weight: 700;
      color: #3b82f6;
      margin-top: 32px;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    h3 {
      font-size: 15px;
      font-weight: 700;
      color: #94a3b8;
      margin-top: 20px;
      margin-bottom: 8px;
    }
    p, li {
      font-size: 14px;
      line-height: 1.7;
      color: #cbd5e1;
    }
    .clause {
      margin-bottom: 18px;
    }
    .clause p {
      margin-bottom: 8px;
    }
    ul {
      margin-left: 20px;
      margin-bottom: 16px;
    }
    ul li {
      margin-bottom: 6px;
    }
    .field {
      color: #3b82f6;
      font-weight: 700;
    }
    .field-underline {
      display: inline-block;
      min-width: 180px;
      border-bottom: 1px solid #3b82f6;
      color: #3b82f6;
      font-weight: 700;
      padding: 0 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .info-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #1e293b;
      font-size: 14px;
    }
    .info-table td:first-child {
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 1px;
      width: 200px;
    }
    .info-table td:last-child {
      color: #e2e8f0;
    }
    .commission-table {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
    }
    .commission-table th {
      background: #1e293b;
      color: #3b82f6;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      padding: 10px 12px;
      text-align: left;
      border-bottom: 2px solid #3b82f6;
    }
    .commission-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #1e293b;
      font-size: 14px;
      color: #e2e8f0;
    }
    .signature-block {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #1e293b;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-block.full {
      grid-template-columns: 1fr;
    }
    .signature-line {
      border-bottom: 1px solid #475569;
      margin-top: 40px;
      margin-bottom: 8px;
    }
    .signature-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .signature-name {
      font-size: 14px;
      color: #e2e8f0;
      font-weight: 600;
      margin-top: 4px;
    }
    .signature-date {
      font-size: 12px;
      color: #64748b;
      margin-top: 12px;
    }
    .document-footer {
      border-top: 1px solid #1e293b;
      padding-top: 20px;
      margin-top: 60px;
      text-align: center;
      font-size: 11px;
      color: #64748b;
      letter-spacing: 1px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .document-footer .tagline {
      color: #3b82f6;
      font-size: 12px;
      margin-bottom: 4px;
    }
    @media print {
      body {
        background: #ffffff;
        color: #0a0a0f;
        padding: 20px;
      }
      .document-header h1 { color: #0a0a0f; }
      .document-footer { color: #475569; }
      p, li { color: #1e293b; }
      .info-table td:last-child { color: #0a0a0f; }
      .info-table td:first-child { color: #475569; }
      .commission-table td { color: #0a0a0f; }
      .field, .field-underline { color: #1d4ed8; border-color: #1d4ed8; }
      h2 { color: #1d4ed8; }
    }
  </style>
</head>
<body>
  <div class="document-header">
    <div class="logo">TUF SPORTS APPAREL</div>
    <h1>${title}</h1>
  </div>
  ${bodyContent}
  <div class="document-footer">
    <div class="tagline">BUILT FOR THE PROGRAM.</div>
    TUF Sports Apparel &nbsp;|&nbsp; Confidential
  </div>
</body>
</html>`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '_______________';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ========== NDA ==========

function generateNDA(data: DocumentData): string {
  const term = data.ndaTermMonths || 24;
  const body = `
  <p class="clause">This Non-Disclosure Agreement (the "Agreement") is entered into as of <span class="field">${formatDate(data.date)}</span> by and between:</p>

  <table class="info-table">
    <tr><td>Disclosing Party</td><td>TUF Sports Apparel, LLC ("TUF Sports")</td></tr>
    <tr><td>Receiving Party</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Email</td><td><span class="field">${data.repEmail}</span></td></tr>
    <tr><td>Company</td><td><span class="field">${data.companyName || '_______________'}</span></td></tr>
    <tr><td>Territory</td><td><span class="field">${data.territory || '_______________'}</span></td></tr>
  </table>

  <h2>1. Definition of Confidential Information</h2>
  <div class="clause">
    <p>"Confidential Information" means any and all information disclosed by TUF Sports to the Receiving Party, whether orally, in writing, or in any other form, including but not limited to:</p>
    <ul>
      <li>Customer and prospect lists, school contact information, and athletic director relationships</li>
      <li>Pricing structures, discount schedules, and commission rates</li>
      <li>Product designs, apparel specifications, and manufacturing processes</li>
      <li>Marketing strategies, territory assignments, and sales playbooks</li>
      <li>Financial data, revenue projections, and business plans</li>
      <li>Software, tools, and proprietary technology platforms</li>
      <li>Training materials, certification content, and operational procedures</li>
    </ul>
  </div>

  <h2>2. Obligations of Receiving Party</h2>
  <div class="clause">
    <p>The Receiving Party agrees to:</p>
    <ul>
      <li>Hold all Confidential Information in strict confidence</li>
      <li>Not disclose Confidential Information to any third party without prior written consent from TUF Sports</li>
      <li>Use Confidential Information solely for the purpose of performing duties as a TUF Sports representative</li>
      <li>Exercise reasonable care to prevent unauthorized disclosure, at least equivalent to the care used for their own confidential information</li>
      <li>Immediately notify TUF Sports upon discovery of any unauthorized disclosure</li>
    </ul>
  </div>

  <h2>3. Exclusions</h2>
  <div class="clause">
    <p>Confidential Information does not include information that:</p>
    <ul>
      <li>Is or becomes publicly available through no fault of the Receiving Party</li>
      <li>Was rightfully in the Receiving Party's possession prior to disclosure</li>
      <li>Is independently developed by the Receiving Party without use of Confidential Information</li>
      <li>Is required to be disclosed by law, regulation, or court order (provided TUF Sports is given prompt notice)</li>
    </ul>
  </div>

  <h2>4. Term and Survival</h2>
  <div class="clause">
    <p>This Agreement shall remain in effect for a period of <span class="field">${term} months</span> from the effective date. The obligations of confidentiality shall survive termination of this Agreement and continue for a period of <span class="field">three (3) years</span> thereafter, or indefinitely for trade secret information.</p>
  </div>

  <h2>5. Return of Materials</h2>
  <div class="clause">
    <p>Upon termination of the relationship or upon written request from TUF Sports, the Receiving Party shall promptly return or destroy all materials containing Confidential Information and certify such return or destruction in writing.</p>
  </div>

  <h2>6. Remedies</h2>
  <div class="clause">
    <p>The Receiving Party acknowledges that unauthorized disclosure may cause irreparable harm to TUF Sports for which monetary damages would be inadequate. TUF Sports shall be entitled to seek injunctive relief in addition to any other remedies available at law or in equity.</p>
  </div>

  <h2>7. Governing Law</h2>
  <div class="clause">
    <p>This Agreement shall be governed by and construed in accordance with the laws of the State of Minnesota, without regard to conflict of law principles.</p>
  </div>

  <div class="signature-block">
    <div>
      <div class="signature-label">TUF Sports Apparel, LLC</div>
      <div class="signature-line"></div>
      <div class="signature-name">Authorized Representative</div>
      <div class="signature-date">Date: <span class="field">${formatDate(data.date)}</span></div>
    </div>
    <div>
      <div class="signature-label">Receiving Party</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.repName}</div>
      <div class="signature-date">Date: _______________</div>
    </div>
  </div>
  `;
  return documentShell('NON-DISCLOSURE AGREEMENT', body);
}

// ========== 90-Day Performance Agreement ==========

function generatePerformanceAgreement(data: DocumentData): string {
  const body = `
  <p class="clause">This 90-Day Performance Agreement (the "Agreement") is entered into as of <span class="field">${formatDate(data.date)}</span> between TUF Sports Apparel, LLC and the undersigned representative.</p>

  <table class="info-table">
    <tr><td>Representative</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Email</td><td><span class="field">${data.repEmail}</span></td></tr>
    <tr><td>Territory</td><td><span class="field">${data.territory || '_______________'}</span></td></tr>
    <tr><td>Sub-Territory</td><td><span class="field">${data.subterritory || '_______________'}</span></td></tr>
    <tr><td>Assigned Director</td><td><span class="field">${data.directorName || '_______________'}</span></td></tr>
    <tr><td>Review Date</td><td><span class="field">${data.reviewDate ? formatDate(data.reviewDate) : '_______________'}</span></td></tr>
  </table>

  <h2>1. Territory Assignment</h2>
  <div class="clause">
    <p>The Representative is assigned to <span class="field">${data.territory || '_______________'}</span> territory, with a primary focus on <span class="field">${data.subterritory || '_______________'}</span>. The Representative is expected to develop relationships, generate opportunities, and close deals exclusively within this assigned territory unless otherwise directed by TUF Sports leadership.</p>
  </div>

  <h2>2. Activity Standards</h2>
  <div class="clause">
    <p>The Representative agrees to maintain the following minimum activity levels throughout the 90-day performance period:</p>
    <ul>
      <li><strong>Outbound Calls:</strong> <span class="field">${data.callsPerDay || 25}</span> calls per day to schools and athletic directors</li>
      <li><strong>Meetings Scheduled:</strong> <span class="field">${data.meetingsPerWeek || 5}</span> qualified meetings per week</li>
      <li><strong>Deals Closed:</strong> <span class="field">${data.dealsPerMonth || 2}</span> closed deals per month minimum</li>
      <li><strong>CRM Hygiene:</strong> All activities logged daily in the TUF Ops platform</li>
      <li><strong>Pipeline Management:</strong> Maintain a pipeline of at least 15 active opportunities at all times</li>
    </ul>
  </div>

  <h2>3. Certification Requirements</h2>
  <div class="clause">
    <p>The Representative must complete all TUF Academy certification requirements within the first 30 days of this agreement, including:</p>
    <ul>
      <li>HR Documentation and onboarding forms</li>
      <li>Director sign-off on territory readiness</li>
      <li>Practical exercise demonstrating product knowledge and sales process</li>
      <li>TUF Academy core curriculum completion</li>
    </ul>
  </div>

  <h2>4. Compensation Terms</h2>
  <div class="clause">
    <p>Compensation during the 90-day period shall be governed by the TUF Sports Commission Structure. Representatives earn commission on closed deals per the standard rate schedule. No base salary or draw is provided unless specified in a separate offer letter.</p>
  </div>

  <h2>5. Performance Review</h2>
  <div class="clause">
    <p>A formal performance review will be conducted on or about <span class="field">${data.reviewDate ? formatDate(data.reviewDate) : '_______________'}</span>. At that time, TUF Sports leadership will evaluate performance against the activity standards outlined in Section 2 and determine continuation, adjustment, or termination of the representative relationship.</p>
  </div>

  <h2>6. At-Will Relationship</h2>
  <div class="clause">
    <p>This Agreement does not constitute an employment contract. The Representative is an independent contractor. Either party may terminate this Agreement at any time, with or without cause, upon written notice.</p>
  </div>

  <div class="signature-block">
    <div>
      <div class="signature-label">TUF Sports Apparel, LLC</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.directorName || 'Authorized Representative'}</div>
      <div class="signature-date">Date: <span class="field">${formatDate(data.date)}</span></div>
    </div>
    <div>
      <div class="signature-label">Representative</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.repName}</div>
      <div class="signature-date">Date: _______________</div>
    </div>
  </div>
  `;
  return documentShell('90-DAY PERFORMANCE AGREEMENT', body);
}

// ========== Commission Payment Form ==========

function generateCommissionForm(data: DocumentData): string {
  const body = `
  <p class="clause">This Commission Payment Authorization Form establishes the payment arrangement between TUF Sports Apparel, LLC and the undersigned representative, effective <span class="field">${formatDate(data.date)}</span>.</p>

  <table class="info-table">
    <tr><td>Representative</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Email</td><td><span class="field">${data.repEmail}</span></td></tr>
    <tr><td>Territory</td><td><span class="field">${data.territory || '_______________'}</span></td></tr>
  </table>

  <h2>1. Direct Deposit Information</h2>
  <div class="clause">
    <p>The Representative authorizes TUF Sports Apparel, LLC to deposit commission payments via ACH transfer to the bank account designated below:</p>
  </div>

  <table class="info-table">
    <tr><td>Bank Name</td><td>_______________</td></tr>
    <tr><td>Account Holder Name</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Routing Number</td><td>_______________</td></tr>
    <tr><td>Account Number</td><td>_______________</td></tr>
    <tr><td>Account Type</td><td>_______________</td></tr>
  </table>

  <h2>2. Tax Information</h2>
  <div class="clause">
    <p>The Representative acknowledges that they are an independent contractor and are responsible for all applicable federal, state, and local taxes. A completed IRS Form W-9 must be on file before any commission payments are issued. TUF Sports will issue IRS Form 1099-NEC for commissions totaling $600 or more in a calendar year.</p>
  </div>

  <h2>3. Commission Rate Schedule</h2>
  <table class="commission-table">
    <thead>
      <tr>
        <th>Category</th>
        <th>Rate</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Standard Apparel</td>
        <td><span class="field">${data.commissionRate || 'Standard Rate'}</span></td>
        <td>Per the TUF Commission Schedule</td>
      </tr>
      <tr>
        <td>Custom / Specialty</td>
        <td>Per-quote basis</td>
        <td>Determined at time of order</td>
      </tr>
      <tr>
        <td>Team Store Revenue</td>
        <td>Per agreement</td>
        <td>Ongoing accounts</td>
      </tr>
    </tbody>
  </table>

  <h2>4. Payment Schedule</h2>
  <div class="clause">
    <p>Commission payments are processed on a <span class="field">${data.paymentSchedule || 'monthly'}</span> basis. Payments are issued within 15 days following the close of each payment period, subject to order verification and customer payment clearance. No commission is earned or payable until TUF Sports has received full payment from the customer.</p>
  </div>

  <h2>5. Commission Disputes</h2>
  <div class="clause">
    <p>Any dispute regarding commission calculations must be submitted in writing within 30 days of the payment date. Failure to dispute within this period constitutes acceptance of the payment as calculated.</p>
  </div>

  <h2>6. Chargebacks and Returns</h2>
  <div class="clause">
    <p>In the event of a customer return, chargeback, or non-payment, any commission previously paid on the affected order will be deducted from future commission payments.</p>
  </div>

  <div class="signature-block">
    <div>
      <div class="signature-label">TUF Sports Apparel, LLC</div>
      <div class="signature-line"></div>
      <div class="signature-name">Authorized Representative</div>
      <div class="signature-date">Date: <span class="field">${formatDate(data.date)}</span></div>
    </div>
    <div>
      <div class="signature-label">Representative</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.repName}</div>
      <div class="signature-date">Date: _______________</div>
    </div>
  </div>
  `;
  return documentShell('COMMISSION PAYMENT AUTHORIZATION FORM', body);
}

// ========== Territory Assignment Letter ==========

function generateTerritoryLetter(data: DocumentData): string {
  const body = `
  <p class="clause">This letter confirms the official territory assignment for <span class="field">${data.repName}</span>, effective <span class="field">${data.effectiveDate ? formatDate(data.effectiveDate) : formatDate(data.date)}</span>.</p>

  <table class="info-table">
    <tr><td>Representative</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Email</td><td><span class="field">${data.repEmail}</span></td></tr>
    <tr><td>Territory</td><td><span class="field">${data.territory || '_______________'}</span></td></tr>
    <tr><td>Zone / Region</td><td><span class="field">${data.zone || '_______________'}</span></td></tr>
    <tr><td>Assigned Director</td><td><span class="field">${data.assignedDirector || data.directorName || '_______________'}</span></td></tr>
    <tr><td>School Count</td><td><span class="field">${data.schoolCount || '_______________'}</span> schools in territory</td></tr>
    <tr><td>Effective Date</td><td><span class="field">${data.effectiveDate ? formatDate(data.effectiveDate) : formatDate(data.date)}</span></td></tr>
  </table>

  <h2>Official Territory Designation</h2>
  <div class="clause">
    <p>By this letter, TUF Sports Apparel, LLC officially designates <span class="field">${data.repName}</span> as the Territory Account Executive (TAE) for <span class="field">${data.territory || '_______________'}</span>, encompassing the <span class="field">${data.zone || '_______________'}</span> zone.</p>
    <p>The territory includes approximately <span class="field">${data.schoolCount || '_____'}</span> schools across the designated region. The Representative is authorized to represent TUF Sports Apparel within this territory and shall be the primary point of contact for all athletic apparel and team gear needs within these boundaries.</p>
  </div>

  <h2>Territory Responsibilities</h2>
  <div class="clause">
    <ul>
      <li>Establish and maintain relationships with athletic directors, coaches, and school administrators</li>
      <li>Present TUF Sports product offerings and services to prospective accounts</li>
      <li>Manage the full sales cycle from initial contact through order delivery</li>
      <li>Maintain accurate records of all territory activity in the TUF Ops platform</li>
      <li>Collaborate with the Assigned Director on territory strategy and account planning</li>
      <li>Protect and grow TUF Sports brand presence within the territory</li>
    </ul>
  </div>

  <h2>Territory Exclusivity</h2>
  <div class="clause">
    <p>This territory assignment is exclusive to the Representative for a period of 90 days from the effective date, subject to the terms of the Performance Agreement. TUF Sports reserves the right to adjust territory boundaries, reassign accounts, or modify this assignment at its sole discretion to optimize territory coverage and business performance.</p>
  </div>

  <h2>Reporting Structure</h2>
  <div class="clause">
    <p>The Representative reports directly to <span class="field">${data.assignedDirector || data.directorName || '_______________'}</span>, who will provide coaching, performance feedback, and territory support throughout the assignment period.</p>
  </div>

  <div class="signature-block full">
    <div>
      <div class="signature-label">TUF Sports Apparel, LLC</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.assignedDirector || data.directorName || 'Authorized Representative'}</div>
      <div class="signature-date">Date: <span class="field">${formatDate(data.date)}</span></div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; padding: 20px; border: 1px solid #3b82f6; border-radius: 4px;">
    <p style="font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">BUILT FOR THE PROGRAM.</p>
    <p style="font-size: 12px; color: #3b82f6; margin-top: 8px;">Welcome to the TUF Sports Family</p>
  </div>
  `;
  return documentShell('TERRITORY ASSIGNMENT LETTER', body);
}

// ========== Offer Letter ==========

function generateOfferLetter(data: DocumentData): string {
  const body = `
  <p class="clause">On behalf of TUF Sports Apparel, LLC, we are pleased to extend this offer to <span class="field">${data.repName}</span> for the position outlined below.</p>

  <table class="info-table">
    <tr><td>Candidate</td><td><span class="field">${data.repName}</span></td></tr>
    <tr><td>Email</td><td><span class="field">${data.repEmail}</span></td></tr>
    <tr><td>Position</td><td><span class="field">${data.position || 'Territory Account Executive (TAE)'}</span></td></tr>
    <tr><td>Start Date</td><td><span class="field">${data.startDate ? formatDate(data.startDate) : '_______________'}</span></td></tr>
    <tr><td>Territory</td><td><span class="field">${data.territory || '_______________'}</span></td></tr>
    <tr><td>Reports To</td><td><span class="field">${data.reportsTo || data.directorName || '_______________'}</span></td></tr>
  </table>

  <h2>1. Position Overview</h2>
  <div class="clause">
    <p>As <span class="field">${data.position || 'Territory Account Executive (TAE)'}</span>, you will be responsible for driving revenue growth within your assigned territory by building relationships with schools, athletic directors, and coaches. You will represent the TUF Sports brand with integrity, energy, and a commitment to excellence.</p>
  </div>

  <h2>2. Compensation Structure</h2>
  <div class="clause">
    <p><span class="field">${data.compensation || 'Commission-based compensation per the TUF Sports Commission Schedule.'}</span></p>
    <p>Compensation details, including commission rates, payment schedules, and performance incentives, are governed by the TUF Sports Commission Structure and the Commission Payment Authorization Form executed separately.</p>
  </div>

  <h2>3. Reporting Structure</h2>
  <div class="clause">
    <p>You will report directly to <span class="field">${data.reportsTo || data.directorName || '_______________'}</span>. Your reporting structure may be adjusted as TUF Sports continues to scale and evolve its organizational design.</p>
  </div>

  <h2>4. Independent Contractor Status</h2>
  <div class="clause">
    <p>This offer is for an independent contractor position. As an independent contractor, you are responsible for your own taxes, insurance, and business expenses unless otherwise agreed in writing. You will receive IRS Form 1099-NEC for commissions earned.</p>
  </div>

  <h2>5. Onboarding Requirements</h2>
  <div class="clause">
    <p>Prior to or within your first week, you must complete the following:</p>
    <ul>
      <li>Execute the Non-Disclosure Agreement</li>
      <li>Complete IRS Form W-9</li>
      <li>Complete the Commission Payment Authorization Form</li>
      <li>Enroll in TUF Academy and begin certification training</li>
      <li>Review and sign the 90-Day Performance Agreement</li>
    </ul>
  </div>

  <h2>6. Acceptance</h2>
  <div class="clause">
    <p>This offer is valid until <span class="field">${formatDate(data.date)}</span>. To accept, please sign below and return this letter along with the completed onboarding documents.</p>
  </div>

  <div class="signature-block">
    <div>
      <div class="signature-label">TUF Sports Apparel, LLC</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.reportsTo || data.directorName || 'Authorized Representative'}</div>
      <div class="signature-date">Date: <span class="field">${formatDate(data.date)}</span></div>
    </div>
    <div>
      <div class="signature-label">Candidate Acceptance</div>
      <div class="signature-line"></div>
      <div class="signature-name">${data.repName}</div>
      <div class="signature-date">Date: _______________</div>
    </div>
  </div>

  <div style="text-align: center; margin-top: 30px; padding: 20px; border: 1px solid #3b82f6; border-radius: 4px;">
    <p style="font-size: 18px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">BUILT FOR THE PROGRAM.</p>
    <p style="font-size: 12px; color: #3b82f6; margin-top: 8px;">Welcome to the TUF Sports Family</p>
  </div>
  `;
  return documentShell('OFFER LETTER', body);
}

function generateFallback(data: DocumentData): string {
  return documentShell('DOCUMENT', `<p>Unknown document type: ${data.type}</p>`);
}
