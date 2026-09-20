import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { getNewsletterIdentity } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy — The EWU Express",
  description:
    "What The EWU Express collects, why, who else sees it, how long we keep it, and how to have your address removed.",
};

const UPDATED = "20 September 2026";

/**
 * Requests the resolved publisher identity (postal address + privacy contact)
 * from settings. Never fails the page: a policy page must always render.
 */
async function identity() {
  try {
    return await getNewsletterIdentity();
  } catch {
    return { postalAddress: "", contactEmail: "" };
  }
}

export default async function PrivacyPage() {
  const { postalAddress, contactEmail } = await identity();

  return (
    <LegalPage
      title="Privacy Policy"
      intro="The short version: we have no reader accounts, no advertising, no trackers and no data brokers. The only personal information we hold about you is the email address you gave us for the newsletter — and you can have it deleted at any time."
      updated={UPDATED}
      contactEmail={contactEmail || undefined}
      postalAddress={postalAddress || undefined}
    >
      <section>
        <h2>Who is responsible for your data</h2>
        <p>
          The EWU Express (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is the student news
          publication of East West University, Dhaka, Bangladesh. We are the data
          controller for the small amount of information described on this page —
          meaning we decide why it is held and what happens to it.
        </p>
        <p>
          Our contact address for anything on this page is printed at the bottom
          of every email we send, and shown at the end of this policy.
        </p>
      </section>

      <section>
        <h2>What we collect, and what we don&apos;t</h2>
        <h3>If you subscribe to the newsletter</h3>
        <ul>
          <li>
            <strong>Your email address</strong> — the only thing you type in.
          </li>
          <li>
            <strong>When you subscribed and when you confirmed</strong>, so we can
            show that you asked for the emails.
          </li>
          <li>
            <strong>Whether you have unsubscribed</strong>, so we never mail you
            again by accident.
          </li>
          <li>
            <strong>Two random codes</strong> tied to your subscription: one for
            the confirmation link, one for the one-click unsubscribe link. They
            identify the subscription, not you, and they are replaced when you
            resubscribe.
          </li>
        </ul>
        <p>
          We never collect your name, phone number, student ID, address, photo,
          or anything about your studies. There are no reader accounts on this
          site.
        </p>

        <h3>Reading counts</h3>
        <p>
          Each story shows how many times it has been read. That counter is a
          number attached to the story, not to you. To stop the same reader being
          counted repeatedly, your IP address is checked in the server&apos;s
          memory for up to one minute and then discarded —{" "}
          <strong>it is never written to our database</strong> and never linked to
          a subscription.
        </p>

        <h3>Signing in (staff only)</h3>
        <p>
          Editorial staff sign in to publish stories. That sets a single session
          cookie, and the account holds a name, an email address and a password
          that is stored only as a one-way hash — we cannot read it.
        </p>

        <h3>Your display preference</h3>
        <p>
          If you switch between light and dark, that choice is saved in your own
          browser (local storage). It is never sent to us.
        </p>

        <h3>What we do not do</h3>
        <ul>
          <li>No advertising, ad networks, or sponsored tracking pixels.</li>
          <li>
            No third-party analytics — no Google Analytics, no session recording,
            no heatmaps.
          </li>
          <li>No social media trackers or embedded follow buttons.</li>
          <li>No profiling, and no automated decisions about you.</li>
          <li>
            We do not sell, rent, or trade your address with anyone, ever.
          </li>
        </ul>
      </section>

      <section>
        <h2>Why we are allowed to hold it</h2>
        <p>
          For newsletter emails, our basis is <strong>your consent</strong>. You
          give it by submitting the form and then clicking the confirmation link
          we email you — we only add an address to the mailing list after that
          click, which is why the first email you receive is a confirmation
          request rather than a story. You can withdraw consent at any time.
        </p>
        <p>
          For reading counts and keeping the site secure (blocking spam signups
          and brute-force attempts), our basis is our{" "}
          <strong>legitimate interest</strong> in running a working publication.
          This processing involves no stored personal data beyond what is
          described above.
        </p>
      </section>

      <section>
        <h2>Who else is involved</h2>
        <p>
          We use a small number of service providers to run the site. They
          process data only on our instructions:
        </p>
        <ul>
          <li>
            <strong>Vercel</strong> — hosts the website. Like any web host, its
            servers record standard request logs, which can include IP addresses.
          </li>
          <li>
            <strong>A managed database service</strong> — stores the subscriber
            list, story content and the delivery log.
          </li>
          <li>
            <strong>Google (Gmail)</strong> — sends our emails from the
            publication&apos;s own mailbox. Google necessarily handles the
            recipient address in order to deliver the message.
          </li>
        </ul>
        <p>
          That is the whole list. We do not share your address with advertisers,
          sponsors, university offices, or other student groups, and we do not
          transfer it for anyone else&apos;s marketing.
        </p>
      </section>

      <section>
        <h2>How long we keep it</h2>
        <ul>
          <li>
            <strong>While you are subscribed:</strong> your address, so we can
            send you stories.
          </li>
          <li>
            <strong>After you unsubscribe:</strong> we keep the address in a
            suppressed state. This is deliberate and is the only way to guarantee
            you are not re-added or mailed again; a bare deletion would allow the
            same address to be subscribed afresh with no memory of your opt-out.
          </li>
          <li>
            <strong>Until you ask us to delete it:</strong> you can request full
            erasure instead of suppression (see below), and we will remove the
            address and its delivery records.
          </li>
          <li>
            <strong>Delivery records</strong> (which story was emailed to which
            address, and whether it succeeded) are kept as an operational log so
            that a send can be retried safely and never duplicated.
          </li>
          <li>
            <strong>Pending signups that never confirm</strong> are never mailed
            and can be deleted on request.
          </li>
        </ul>
      </section>

      <section>
        <h2>Your choices and your rights</h2>
        <ul>
          <li>
            <strong>Unsubscribe</strong> — every email carries a one-click
            unsubscribe link in the footer, and mailbox providers can use the
            standard unsubscribe button shown at the top of the message. Either
            one takes effect immediately.
          </li>
          <li>
            <strong>Delete</strong> — ask us and we will erase your address and
            its delivery history from the mailing list.
          </li>
          <li>
            <strong>Access or copy</strong> — ask us what we hold about your
            address and we will provide it.
          </li>
          <li>
            <strong>Correct</strong> — if your address was recorded wrongly, tell
            us and we will fix it.
          </li>
          <li>
            <strong>Object</strong> — you can object to any processing described
            here; if you are subscribed, unsubscribing settles the question
            immediately.
          </li>
          <li>
            <strong>Complain</strong> — if you are in the EU or UK you may
            complain to your national data protection authority. Wherever you
            are, please tell us first so we can fix it.
          </li>
        </ul>
        <p>
          We answer these requests as quickly as we can and, at the latest, within
          30 days.
        </p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          This site sets only one cookie: a session cookie created when an editor
          signs in to the publishing panel. It is strictly necessary for that
          sign-in, and readers never receive it. Your light/dark preference lives
          in your browser&apos;s local storage and is not a cookie.
        </p>
        <p>
          Because we use no advertising, analytics or tracking cookies, visitors
          are not asked to consent to any. If that ever changes, we will ask you
          first.
        </p>
      </section>

      <section>
        <h2>Emails we send</h2>
        <p>
          There are exactly two kinds: the one-time confirmation message when you
          sign up, and a story email when we publish. We do not send marketing,
          sponsored mail, or anything on behalf of third parties, and we do not
          rent the list out.
        </p>
      </section>

      <section>
        <h2>Security</h2>
        <p>
          Traffic is encrypted in transit. The mailing list and editorial panel
          are reachable only by authenticated staff, passwords are stored as
          hashes, and sign-up and sign-in attempts are rate-limited to block
          abuse. If we ever became aware of a breach affecting your address, we
          would tell you.
        </p>
      </section>

      <section>
        <h2>Students, and readers under 18</h2>
        <p>
          Our audience is university students and staff. We do not knowingly
          collect information from anyone under 18, and we do not target the
          newsletter at minors. If you believe a child has subscribed, contact us
          and we will remove the address.
        </p>
      </section>

      <section>
        <h2>Changes to this policy</h2>
        <p>
          If we change how we handle your data, we will update this page and move
          the date at the top. If the change is significant — for example, if we
          ever introduced analytics or advertising — we would tell subscribers by
          email before it took effect.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>
          Read the{" "}
          <a href="/terms">terms of use</a> for how the publication and its
          content may be used, or contact us using the details at the end of this
          page.
        </p>
      </section>
    </LegalPage>
  );
}
