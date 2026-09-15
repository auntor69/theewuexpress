import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { config as loadEnv } from "dotenv";
import bcrypt from "bcryptjs";
import { posts, adminUsers } from "./schema";

loadEnv({ path: ".env.local", quiet: true });
loadEnv({ quiet: true });

const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

const db = drizzle(client);

const samplePosts = [
  {
    title: "The Untold Stories of Campus Night Life",
    slug: "untold-stories-campus-night-life",
    caption: "What really happens when the sun goes down at EWU? We went deep.",
    content: `<p>There's a different energy on campus after dark. The library lights glow amber, the cafeteria turns into a makeshift study lounge, and somewhere in the distance, someone is playing guitar on the steps of the arts building.</p>
<blockquote>"Campus at night feels like a different world. It's where the real conversations happen." — Anonymous Student</blockquote>
<p>We spent two weeks documenting the nightlife culture at EWU, and what we found surprised even us. From late-night food runs to spontaneous jam sessions, the after-hours scene tells a story that no brochure ever will.</p>
<p>The photography club meets at midnight to capture the campus under moonlight. The debate team practices until 2 AM before tournaments. And then there are the quiet ones — students who find peace in the emptiness of a campus that never truly sleeps.</p>
<blockquote>"I do my best thinking at 3 AM in the library. It's just me and the security guard." — Rafiq, Computer Science</blockquote>
<p>This is the EWU they don't put on the website. But maybe they should.</p>`,
    coverImage: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&h=800&fit=crop",
    category: "campus-heat",
    tags: JSON.stringify(["nightlife", "campus", "culture"]),
    featured: true,
    editorPick: true,
    views: 2847,
  },
  {
    title: "The Professor Who Teaches Without a Syllabus",
    slug: "the-professor-who-teaches-without-a-syllabus",
    caption: "One EWU faculty member ditched the script — and his classes filled up overnight.",
    content: `<p>Walk into Room 402 on a Tuesday and you won't find a lecture plan on the board. You'll find a question.</p>
<blockquote>"I don't teach subjects. I teach people how to think about subjects." — the professor, when we asked why</blockquote>
<p>His approach is simple: every semester, students vote on the topics. The syllabus writes itself, week by week, based on what the class actually wants to understand.</p>
<p>Attendance? Nearly perfect. Grades? Better than department average. And the waiting list to get into his section keeps growing every semester.</p>
<p>Not everyone is convinced. Some faculty argue structure matters. But the students in Room 402 say they've never been more engaged.</p>`,
    coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&h=800&fit=crop",
    category: "campus-heat",
    tags: JSON.stringify(["faculty", "teaching", "campus"]),
    featured: true,
    editorPick: false,
    views: 3120,
  },
  {
    title: "The Art of Surviving Finals Week",
    slug: "surviving-finals-week",
    caption: "Strategies, memes, and real talk from students who've been through it all.",
    content: `<p>Finals week at EWU is less of a week and more of a survival event. Think Hunger Games, but with textbooks and energy drinks.</p>
<blockquote>"I once studied for 14 hours straight, only to realize I was preparing for the wrong exam." — Actual Student</blockquote>
<p>We asked seniors to share their best survival tips, and here's what we got:</p>
<h3>1. Start Early (Yes, Really)</h3>
<p>The number one piece of advice from every top student: don't cram. Start reviewing at least two weeks before finals. Your future self will thank you.</p>
<h3>2. Find Your Study Spot</h3>
<p>Whether it's the library's quiet zone, an empty classroom, or your bed (no judgment), find a space that works for you and own it.</p>
<h3>3. Take Breaks</h3>
<p>The Pomodoro technique isn't just a fancy name. 25 minutes of focused study followed by a 5-minute break actually works.</p>
<h3>4. Don't Compare</h3>
<blockquote>"Someone will always seem more prepared than you. Focus on your own journey."</blockquote>
<p>Finals are temporary. Your mental health isn't. Take care of yourself first.</p>`,
    coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=800&fit=crop",
    category: "stories",
    tags: JSON.stringify(["finals", "study", "tips"]),
    featured: false,
    editorPick: true,
    views: 1893,
  },
  {
    title: "Inside EWU's Underground Music Scene",
    slug: "ewu-underground-music-scene",
    caption: "From dorm room productions to campus concerts — meet the artists.",
    content: `<p>Behind the lecture halls and lab reports, there's a beat. A rhythm that pulses through the corridors of EWU, carried by students who refuse to let their creative fire die.</p>
<blockquote>"I started making beats in my dorm room with a $50 MIDI controller. Now I've played at three campus events." — Nabil, BBA Department</blockquote>
<p>EWU's music scene is small but fierce. There are no formal music programs, no fancy studios, no record deals. But what exists is raw, authentic, and deeply personal.</p>
<p>We found bedroom producers making lo-fi beats between assignments, poets turning their words into spoken word performances, and bands that rehearse in parking garages because the practice rooms are always booked.</p>
<h3>The Players</h3>
<p>Meet some of the artists shaping EWU's sound:</p>
<p><strong>Resonance</strong> — A four-piece band that plays everything from Bangla rock to indie folk. Their campus concert last spring drew over 300 students.</p>
<p><strong>DJ Cipher</strong> — Known for his late-night SoundCloud mixes, he's become the go-to DJ for department events.</p>
<p><strong>Verse &amp; Vibe</strong> — A poetry collective that merges spoken word with ambient music. Their monthly open mic nights have become a campus staple.</p>
<blockquote>"Music is how we process this chaos called university life." — Verse &amp; Vibe Founder</blockquote>
<p>The scene may be underground, but it deserves the spotlight.</p>`,
    coverImage: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=1200&h=800&fit=crop",
    category: "stories",
    tags: JSON.stringify(["music", "culture", "arts"]),
    featured: true,
    editorPick: true,
    views: 4102,
  },
  {
    title: "Spring Fest 2025: Everything You Need to Know",
    slug: "spring-fest-2025-guide",
    caption: "The ultimate guide to EWU's biggest event of the year.",
    content: `<p>It's that time of year again. Spring Fest is around the corner, and if you're not excited, you haven't been paying attention.</p>
<p>This year's edition promises to be the biggest yet, with three days of events, performances, and enough memories to last a lifetime.</p>
<h3>Day 1: The Opening</h3>
<p>The fest kicks off with the traditional flag-raising ceremony, followed by the inter-department debate finals. In the evening, expect a food festival featuring vendors from across the city.</p>
<h3>Day 2: The Main Event</h3>
<p>This is the big one. The outdoor concert stage goes live at 4 PM with performances from student bands, followed by the headliner act (still under wraps, but rumors are flying).</p>
<h3>Day 3: The Finale</h3>
<p>Cultural performances, the much-anticipated fashion show, and the closing ceremony. Bring tissues — the seniors always cry.</p>
<blockquote>"Spring Fest isn't just an event. It's the one time the entire university feels like a family." — Event Coordinator</blockquote>
<p>Whether you're a freshman experiencing it for the first time or a senior savoring your last, Spring Fest is EWU at its absolute best.</p>`,
    coverImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop",
    category: "events",
    tags: JSON.stringify(["spring-fest", "events", "campus"]),
    featured: false,
    editorPick: false,
    views: 6789,
  },
  {
    title: "Freshers' Week 2025: Full Schedule Released",
    slug: "freshers-week-2025-full-schedule",
    caption: "Club sign-ups, campus tours, and the welcome concert — here's the complete lineup.",
    content: `<p>Freshers' Week is here, and this year's schedule is the biggest in EWU history.</p>
<h3>Monday: Orientation &amp; Campus Tours</h3>
<p>Report to the auditorium at 9 AM. Department orientations run through the morning; campus tours leave every hour from the main gate.</p>
<h3>Tuesday: Club Fair</h3>
<p>Over 40 clubs will be set up in the plaza. Bring your student ID — most sign-ups take two minutes.</p>
<h3>Wednesday: Sports Tryouts</h3>
<p>Football, cricket, basketball, and table tennis tryouts start at 3 PM at the ground floor courts.</p>
<h3>Friday: Welcome Concert</h3>
<p>The week closes with the official welcome concert at 5 PM. Entry is free with a student ID.</p>
<blockquote>"Freshers' week is how lifelong friendships start. Show up to everything." — Student Affairs</blockquote>`,
    coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&h=800&fit=crop",
    category: "events",
    tags: JSON.stringify(["freshers", "events", "orientation"]),
    featured: false,
    editorPick: false,
    views: 2450,
  },
  {
    title: "Did You Know? EWU's Library Has a 4th Floor Most Students Never Visit",
    slug: "did-you-know-library-4th-floor",
    caption: "Silent zones, an archive collection, and the best window view on campus.",
    content: `<p>Most students stop at the third floor. But climb one more flight of stairs and you'll find something special.</p>
<h3>The Silent Zone</h3>
<p>The entire fourth floor is a designated silent zone — no group study, no discussions. Just you, your books, and near-perfect quiet.</p>
<h3>The Archive Collection</h3>
<p>Back issues of every university publication since EWU's founding are kept here, along with out-of-print reference texts that aren't in the digital catalog.</p>
<h3>The Window Seats</h3>
<p>The east-facing windows have the best view of the lake on campus. Come at 5 PM and watch the sky change colors between pages.</p>
<blockquote>"I wrote my entire thesis on the fourth floor. It's the best-kept secret at EWU." — Final year, ECE</blockquote>
<p>Opening hours match the main library. Go before everyone finds out.</p>`,
    coverImage: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&h=800&fit=crop",
    category: "did-you-know",
    tags: JSON.stringify(["library", "campus-facts"]),
    featured: false,
    editorPick: true,
    views: 1980,
  },
  {
    title: "Did You Know? Your Student ID Gets You 12 Discounts Off Campus",
    slug: "did-you-know-student-id-discounts",
    caption: "From restaurants to bookshops — the full list of places that honor the EWU card.",
    content: `<p>Your student ID isn't just for the library gate. We called and verified every claim — these 12 places near campus offer real discounts.</p>
<h3>Food</h3>
<p>Four restaurants within walking distance offer 10–15% off with a valid EWU ID. Two of them don't advertise it — you have to ask.</p>
<h3>Books &amp; Printing</h3>
<p>The photocopy shop opposite Gate 2 gives a flat student rate that's 30% below the listed price. The bookshop on the corner runs a semester-long 20% deal on course texts.</p>
<h3>Transport &amp; More</h3>
<p>Two ride-sharing services have standing student promotions, and the gym three blocks away offers a monthly rate nearly half the regular price.</p>
<blockquote>"I found out about the gym discount in my final semester. Three years too late." — Anonymous senior</blockquote>
<p>The full verified list is pinned in the student portal. Check it before you pay full price anywhere.</p>`,
    coverImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=800&fit=crop",
    category: "did-you-know",
    tags: JSON.stringify(["discounts", "student-life"]),
    featured: false,
    editorPick: false,
    views: 5310,
  },
];

async function seed() {
  const targetUrl = process.env.DATABASE_URL || "file:local.db";
  const isRemote = /^(libsql|https?):/i.test(targetUrl);
  console.log(`Seeding database: ${isRemote ? "Turso cloud" : targetUrl}`);

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db
    .insert(adminUsers)
    .values({
      email: "admin@ewuexpress.com",
      password: hashedPassword,
      name: "Admin",
    })
    .onConflictDoNothing();

  for (const post of samplePosts) {
    await db.insert(posts).values(post).onConflictDoNothing();
  }

  console.log("Seeding complete!");
  console.log("Admin credentials: admin@ewuexpress.com / admin123");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
