// LEGAL DISCLAIMER: This content was generated as a starting template.
// Ben should have it reviewed by a qualified attorney before launching to the public,
// especially the data processing, payment, and dispute resolution clauses.
//
// TODO: Update the mailing address with your real business address before launch.

import { LegalPageLayout } from "@/components/legal/legal-page-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DMCA Policy",
  description: "Quiver Markets Digital Millennium Copyright Act policy and takedown procedure.",
};

export default function DmcaPolicyPage() {
  return (
    <LegalPageLayout
      title="DMCA Policy"
      subtitle="Copyright takedown notice and counter-notification procedure."
      lastUpdated="April 11, 2026"
    >
      <p>
        Quiver Markets respects the intellectual property rights of others and expects users of the Service to do
        the same. In accordance with the Digital Millennium Copyright Act of 1998 (&ldquo;DMCA&rdquo;), we will
        respond promptly to notices of alleged copyright infringement that are reported to our Designated Copyright
        Agent, identified below.
      </p>

      <h2>1. Reporting Copyright Infringement</h2>
      <p>
        If you believe that content accessible through the Service infringes your copyright, you may submit a DMCA
        takedown notice to our Designated Agent. To be effective, your notice must be a written communication that
        includes all of the following:
      </p>

      <h2>2. What to Include in a DMCA Notice</h2>
      <ol>
        <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf.</li>
        <li>Identification of the copyrighted work claimed to have been infringed. If multiple works are covered by a single notice, provide a representative list.</li>
        <li>Identification of the material that is claimed to be infringing or to be the subject of infringing activity, and information reasonably sufficient to permit us to locate the material (e.g., the URL where the content appears).</li>
        <li>Your contact information, including your name, mailing address, telephone number, and email address.</li>
        <li>A statement that you have a good faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.</li>
        <li>A statement that the information in the notification is accurate, and, under penalty of perjury, that you are the copyright owner or are authorized to act on behalf of the copyright owner.</li>
      </ol>

      <h2>3. Send DMCA Notices To</h2>
      <div className="bg-[#161b27] border border-[#21262d] rounded-xl p-5 space-y-1 font-mono text-sm">
        <div><strong>Designated Agent:</strong> Ben Horch</div>
        <div><strong>Email:</strong> <a href="mailto:dmca@quivermarkets.com">dmca@quivermarkets.com</a></div>
        <div><strong>Mailing Address:</strong></div>
        <div className="pl-4 text-[#484f58]">
          {/* TODO: Replace with real business address before launch */}
          Quiver Markets<br />
          [Business Address — Update Before Launch]<br />
          United States
        </div>
      </div>
      <p>
        Email is the fastest way to reach us. We aim to respond to all DMCA notices within 5 business days.
      </p>

      <h2>4. Counter-Notification Procedure</h2>
      <p>
        If you believe that material you posted was removed or disabled as a result of a mistake or misidentification,
        you may submit a counter-notification. Your counter-notification must include:
      </p>
      <ol>
        <li>Your physical or electronic signature.</li>
        <li>Identification of the material that was removed or disabled, and the location where it appeared before removal.</li>
        <li>A statement under penalty of perjury that you have a good faith belief that the material was removed or disabled as a result of mistake or misidentification.</li>
        <li>Your name, address, and telephone number, and a statement that you consent to jurisdiction of the Federal District Court for the judicial district in which your address is located (or, if your address is outside the US, any judicial district in which Quiver Markets may be found), and that you will accept service of process from the person who provided the original DMCA notice.</li>
      </ol>
      <p>
        Send counter-notifications to the same address as takedown notices above. Upon receipt of a valid
        counter-notification, we may restore the removed material unless the original complainant files a court action
        within 14 business days.
      </p>

      <h2>5. Repeat Infringer Policy</h2>
      <p>
        It is our policy to terminate, in appropriate circumstances, the accounts of users who are repeat infringers.
        If we receive multiple valid DMCA notices attributable to the same account, we will take appropriate action up
        to and including permanent account termination.
      </p>

      <h2>6. Misrepresentation</h2>
      <p>
        Under Section 512(f) of the DMCA, any person who knowingly materially misrepresents that material is
        infringing, or that material was removed by mistake, may be subject to liability. Please ensure your DMCA
        notice is accurate and in good faith before submitting.
      </p>
    </LegalPageLayout>
  );
}
