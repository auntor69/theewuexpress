import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { posts, adminUsers } from "./schema";
import bcrypt from "bcryptjs";

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
    title: "Confessions: I Failed 3 Courses and Still Graduated",
    slug: "confessions-failed-3-courses-graduated",
    caption: "A raw, honest account of academic failure and coming back stronger.",
    content: `<p>Let me start by saying this: failing doesn't make you a failure. It took me four semesters and a lot of tears to understand that.</p>
<blockquote>"When I saw that F on my transcript for the first time, I locked myself in my room for two days." — The Author</blockquote>
<p>I was the kid who always got good grades in school. University was supposed to be my launchpad. Instead, it became my wake-up call.</p>
<p>The first course I failed was Calculus II. Not because I couldn't understand it, but because I stopped trying. The freedom of university life consumed me — late nights, new friends, the illusion that there was always tomorrow.</p>
<p>By my third semester, I had failed two more courses. My parents were devastated. My advisor suggested I consider "alternative paths." But something inside me refused to quit.</p>
<blockquote>"The semester I almost dropped out was the semester I found my purpose."</blockquote>
<p>I started over. Not from scratch, but from truth. I acknowledged what went wrong, sought help, and showed up every single day. It took an extra year, but I walked across that stage with my head held high.</p>
<p>If you're reading this and you're in that dark place — keep going. Your transcript doesn't define your story.</p>`,
    coverImage: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&h=800&fit=crop",
    category: "confessions",
    tags: JSON.stringify(["personal", "academic", "motivation"]),
    featured: true,
    editorPick: false,
    views: 5231,
  },
  {
    title: "Why EWU's Food Court Needs a Revolution",
    slug: "ewu-food-court-needs-revolution",
    caption: "We surveyed 200 students. The results will make you hungry for change.",
    content: `<p>Let's be honest: the food court situation at EWU is... complicated. Between the overpriced samosas and the mystery meat in the cafeteria, students deserve better.</p>
<p>We surveyed 200 students across all departments, and the numbers paint a clear picture:</p>
<ul><li>78% said they're unsatisfied with food quality</li><li>65% bring food from home at least 3 times a week</li><li>89% would pay more for better options</li></ul>
<blockquote>"I've been eating the same chicken roll for 4 years. Not by choice." — Final Year Student</blockquote>
<p>But it's not all bad news. The new juice bar near the library has been a hit, and the student-run bake sales on Thursdays have become a campus institution.</p>
<p>What EWU needs is not just better food — it needs a food culture. A space where eating isn't just fuel, but an experience. Other universities have farm-to-table programs, student-run cafes, and diverse cuisines. Why can't we?</p>
<p>The administration has promised changes. We'll be watching.</p>`,
    coverImage: "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1200&h=800&fit=crop",
    category: "real-talk",
    tags: JSON.stringify(["food", "campus", "survey"]),
    featured: false,
    editorPick: true,
    views: 3456,
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
    editorPick: false,
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
<p><strong>Verse & Vibe</strong> — A poetry collective that merges spoken word with ambient music. Their monthly open mic nights have become a campus staple.</p>
<blockquote>"Music is how we process this chaos called university life." — Verse & Vibe Founder</blockquote>
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
    title: "Dear Freshman: Letters from Seniors Who Survived",
    slug: "dear-freshman-letters-from-seniors",
    caption: "Honest, emotional, sometimes funny letters to incoming students.",
    content: `<p>Every senior has something they wish they knew as a freshman. We asked graduating students to write one letter to their younger selves. Here are the ones that hit different.</p>
<hr/>
<blockquote>"Dear Freshman Me,<br/><br/>Stop trying to impress everyone. The friends who matter will find you. Also, that crush in your Intro to Business class? Yeah, don't bother.<br/><br/>— Tania, English Department"</blockquote>
<hr/>
<blockquote>"Dear Freshman Me,<br/><br/>Go to office hours. Seriously. The professors are actually cool when you talk to them one-on-one. Also, join at least one club. The Photography Club changed my life.<br/><br/>— Karim, CSE Department"</blockquote>
<hr/>
<blockquote>"Dear Freshman Me,<br/><br/>You're going to fail. Not just exams — you're going to fail at friendships, at time management, at staying awake in 8 AM classes. And that's okay. Failure is just education wearing a different outfit.<br/><br/>— Priya, Pharmacy Department"</blockquote>
<hr/>
<p>These letters remind us that university isn't just about the degree. It's about becoming the person who earns it.</p>
<blockquote>"Four years ago, I walked through those gates terrified. Today, I walk out transformed." — Anonymous Senior</blockquote>`,
    coverImage: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&h=800&fit=crop",
    category: "campus-heat",
    tags: JSON.stringify(["freshman", "seniors", "advice"]),
    featured: false,
    editorPick: true,
    views: 3892,
  },
  {
    title: "The Mental Health Crisis Nobody Talks About",
    slug: "mental-health-crisis-nobody-talks-about",
    caption: "Breaking the silence on student mental health at EWU.",
    content: `<p>In a university of thousands, loneliness shouldn't exist. But it does. And it's more common than anyone wants to admit.</p>
<blockquote>"I sat in a classroom of 60 students and felt completely alone." — Anonymous</blockquote>
<p>Mental health among university students is a global crisis, and EWU is no exception. We spoke to students, counselors, and faculty to understand the scope of the problem — and what can be done.</p>
<h3>The Numbers</h3>
<p>While EWU doesn't publish official mental health statistics, our anonymous survey of 150 students revealed:</p>
<ul><li>62% reported feeling anxious "most days"</li><li>45% said they've considered seeking professional help but didn't know where to go</li><li>38% said academic pressure is their primary source of stress</li></ul>
<h3>The Stigma</h3>
<p>The biggest barrier isn't access — it's stigma. Students fear being judged by peers, labeled by faculty, or dismissed by family.</p>
<blockquote>"I told my parents I was depressed. They told me to pray more." — Anonymous Student</blockquote>
<h3>What Needs to Change</h3>
<p>EWU needs a dedicated, accessible mental health center. Not just a counselor's office tucked away in an admin building, but a visible, welcoming space where seeking help is normalized.</p>
<p>If you're struggling, you're not alone. And asking for help isn't weakness — it's the bravest thing you can do.</p>`,
    coverImage: "https://images.unsplash.com/photo-1474631245212-32dc3c8310c6?w=1200&h=800&fit=crop",
    category: "real-talk",
    tags: JSON.stringify(["mental-health", "wellbeing", "campus"]),
    featured: true,
    editorPick: true,
    views: 7234,
  },
];

async function seed() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("admin123", 10);
  await db.insert(adminUsers).values({
    email: "admin@ewuexpress.com",
    password: hashedPassword,
    name: "Admin",
  }).onConflictDoNothing();

  for (const post of samplePosts) {
    await db.insert(posts).values(post).onConflictDoNothing();
  }

  console.log("Seeding complete!");
  console.log("Admin credentials: admin@ewuexpress.com / admin123");
}

seed().catch(console.error);
