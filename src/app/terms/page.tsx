import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getNewsletterIdentity } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Use — The EWU Express",
  description:
    "How The EWU Express content may be used, the rules for reader contributions, our corrections and takedown process, and the limits of our liability.",
};

const UPDATED = "20 September 2026";

async function identity() {
  try {
    return await getNewsletterIdentity();
  } catch {
    return { postalAddress: "", contactEmail: "" };
  }
}

export default async function TermsPage() {
  const { postalAddress, contactEmail } = await identity();

  return (
    <LegalPage
      title="Terms of Use"
      intro="Plain terms for a student newsroom. Use the site normally, credit us when you quote us, tell us if we get something wrong, and don't use our work as your own."
      updated={UPDATED}
      contactEmail={contactEmail || undefined}
      postalAddress={postalAddress || undefined}
    >
      <section>
        <h2>1. Who we are, and what this site is</h2>
        <p>
          The EWU Express is the student news publication of East West
          University, Dhaka. It is written and run by students.
        </p>
        <p>
          The views expressed in our reporting, columns and opinion pieces are
          those of the publication and its writers. They are{" "}
          <strong>
            not the official position of East West University
          </strong>{" "}
          and should not be read as university policy, announcements or
          statements on behalf of the institution.
        </p>
        <p>
          By using this website or subscribing to our emails, you accept these
          terms. If you do not accept them, please do not use the site.
        </p>
      </section>

      <section>
        <h2>2. Using the site</h2>
        <p>
          You are welcome to read every story, free and without an account. In
          return, please do not:
        </p>
        <ul>
          <li>
            copy or republish our articles, photos or design wholesale, or pass
            them off as your own;
          </li>
          <li>
            scrape or bulk-download the site, or use automated tools to hammer
            it, bypass its rate limits, or probe it for weaknesses;
          </li>
          <li>
            misuse the newsletter form — including subscribing an address that
            is not yours, or attempting to flood the list with fake signups;
          </li>
          <li>
            impersonate the publication, its editors, or another student;
          </li>
          <li>
            use our material to harass, defame or harm any student, staff member
            or member of the public.
          </li>
        </ul>
        <p>
          We may block anyone who breaks these rules, and we may report conduct
          that is unlawful.
        </p>
      </section>

      <section>
        <h2>3. Copyright, and how you may reuse our work</h2>
        <p>
          All original articles, headlines, photographs, illustrations, layout
          and the masthead are &copy; The EWU Express, unless a story says
          otherwise. All rights are reserved.
        </p>
        <h3>You may, without asking</h3>
        <ul>
          <li>
            share a link to any story — on WhatsApp, social media, or anywhere
            else;
          </li>
          <li>
            quote a short passage (a sentence or two) with clear credit to The
            EWU Express and a link to the original;
          </li>
          <li>share our stories for personal, non-commercial use.</li>
        </ul>
        <h3>You may not, without our written permission</h3>
        <ul>
          <li>
            copy a story in full, or in substantial part, onto another website,
            publication or social post;
          </li>
          <li>
            use our articles, photos or logo for any commercial purpose,
            advertising, or paid content;
          </li>
          <li>
            alter a story, or use a quote out of context in a way that changes
            its meaning;
          </li>
          <li>
            remove or obscure our name, the reporter&apos;s byline, or the
            copyright notice.
          </li>
        </ul>
        <p>
          To request permission for anything else, contact us using the details
          at the end of this page.
        </p>
      </section>

      <section>
        <h2>4. Images and material from elsewhere</h2>
        <p>
          Some photographs and graphics are used under free or open licences, or
          come from contributors. Where a licence requires it, we credit the
          source. If you are the owner of any material on this site and believe
          it has been used incorrectly, or without the permission you granted,
          contact us and we will review it promptly and remove or correct it.
        </p>
        <p>
          Please include the story, the item, and enough detail for us to locate
          it — that lets us act in days rather than weeks.
        </p>
      </section>

      <section>
        <h2>5. Reader contributions, tips and submissions</h2>
        <p>
          We welcome tips, story ideas and written contributions from students.
          If you send us material, the following applies:
        </p>
        <ul>
          <li>
            <strong>It must be true and yours to send.</strong> By submitting,
            you confirm the content is accurate to the best of your knowledge and
            that you have the right to share it — including anything you quote,
            photograph or record.
          </li>
          <li>
            <strong>It must not be unlawful.</strong> No defamation, harassment,
            hate speech, threats, doxxing, privacy intrusions, or material that
            infringes someone else&apos;s copyright. This applies to anonymous
            contributions exactly as it does to named ones — anonymity protects
            your identity, not the claim.
          </li>
          <li>
            <strong>We may edit, or decline.</strong> We may cut for length,
            sharpen for clarity, verify details, and choose not to publish. We
            are under no obligation to publish any submission.
          </li>
          <li>
            <strong>We may remove.</strong> We can edit, update or remove
            published material at any time — for accuracy, legal reasons, or at
            the request of a contributor who prefers to withdraw a piece.
          </li>
          <li>
            <strong>We may verify independently.</strong> We may contact you, or
            others named in the material, before publication.
          </li>
        </ul>
        <p>
          We do not accept the format &ldquo;publish this or we will take it
          elsewhere&rdquo; — verification is not optional for a publication that
          puts its name on a story.
        </p>
      </section>

      <section>
        <h2>6. Accuracy, corrections and complaints</h2>
        <p>
          We report in good faith and try to be accurate. Mistakes happen, and
          when they do we correct them: significant corrections are noted in the
          story rather than silently edited away.
        </p>
        <p>
          If you have been named in a story and believe something is wrong, or if
          you believe a story about you is unfair or intrusive, contact us with
          the specific detail you dispute. We will look into it and respond.
        </p>
        <p>
          Opinion and analysis pieces are labelled as such and reflect the
          writer&apos;s view; they are not statements of fact.
        </p>
      </section>

      <section>
        <h2>7. Links to other sites</h2>
        <p>
          Stories may link to other websites, or embed a post, video or document
          hosted elsewhere. We do not control those sites and are not responsible
          for their content, accuracy or privacy practices. Following such a link
          means leaving our terms and privacy policy behind.
        </p>
      </section>

      <section>
        <h2>8. Email and the newsletter</h2>
        <p>
          Subscribing is optional and free. You can unsubscribe from the link in
          any email, and you will be removed from the list. The details of what
          we store are in our{" "}
          <a href="/privacy">privacy policy</a>.
        </p>
      </section>

      <section>
        <h2>9. Availability, and no warranties</h2>
        <p>
          The site is provided &ldquo;as is&rdquo; and may be unavailable,
          interrupted, or changed without notice. To the fullest extent permitted
          by law, we make no warranty that the site will be error-free, secure,
          uninterrupted, or that the content is complete or current.
        </p>
      </section>

      <section>
        <h2>10. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, The EWU Express, its student
          editors, writers, contributors and volunteers are not liable for any
          indirect or consequential loss, or any loss of data, income or
          opportunity, arising from your use of this site or reliance on its
          content.
        </p>
        <p>
          Nothing in these terms excludes liability that cannot lawfully be
          excluded, and nothing here limits your rights under applicable
          consumer law.
        </p>
      </section>

      <section>
        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms; the date at the top of this page always
          shows the current version. Continuing to use the site after a change
          means you accept the updated terms.
        </p>
      </section>

      <section>
        <h2>12. Governing law</h2>
        <p>
          These terms are governed by the laws of the People&apos;s Republic of
          Bangladesh, and any dispute arising from them is subject to the
          jurisdiction of the courts of Dhaka.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          For permissions, corrections, complaints, takedowns or anything else
          covered here, use the contact details at the end of this page. Please
          write from a working address — we need to be able to reply.
        </p>
      </section>
    </LegalPage>
  );
}
