# A+ Auto Repair — why the site needs to come back, and why you should hire me to do it

**Prepared by:** Jake Viefhaus, Florissant, MO
**Prepared for:** A+ Auto Repair, 3659 N Lindbergh Blvd, St. Ann, MO 63074
**Date of findings:** 2026-09-30 (every technical claim below was re-measured on this date)

---

## The short version

Your domain is paid for, in good standing, and set to expire in May 2027. It also does not
load a website. Not a bad website, not an old website — no website at all. Anyone who looks
you up, sees your name and number, and clicks your own address gets a browser error instead
of your business.

You are almost certainly still getting customers. That is not the problem. The problem is the
people who find you, get interested, and then bounce before they ever call — and the fact
that right now there is a cheap fix available that will make this situation permanently
worse, and is very likely to be the fix you pick.

That second point is the whole argument. Let me show you both.

---

## What I checked, and exactly what I found

I did not guess at any of this. Here is the state of your domain as of 2026-09-30.

**The website record is missing.**

```
dig aplusauto.org A       ->  (no answer)
dig aplusauto.org AAAA    ->  (no answer)
dig www.aplusauto.org A   ->  (no answer)

status: NOERROR, ANSWER: 0
```

That is the technical signature of a domain that is pointed at nothing. It is not a server
that is down, and it is not a page that is slow. There is no address for the internet to
send visitors to. A browser typed into that field has nothing to display, so it stops and
shows an error instead.

**Everything else about the domain is healthy.** This is the important part, and it is
better news than you might expect:

| Thing | State |
|---|---|
| Registered | 2012-05-10, eNom — 14 years, continuously held |
| Expires | **2027-05-10** |
| Last updated | 2026-08-12 (recently touched) |
| Nameservers | DreamHost (ns1/ns2/ns3) |
| Email (MX) | Working — `mail.aplusauto.org` → 216.55.149.40 |

So: you have been paying to keep a domain for fourteen years, your email still works, your
hosting is still there, and the only missing piece is the one line of configuration that
tells a browser where your website lives. This is not a business in trouble. It is a
finished asset with a single wire pulled out of it.

**Your site was real, and it was up until fairly recently.** I pulled your own site's
history from the Internet Archive — 1,440 archived captures going back to 2007. The most
recent successful capture is **2025-07-12**. It was a WordPress site (homepage lived at
`/wp/`, a Bridge theme with sliders and a page builder), with pages for About, Customers,
Services, Exhaust Systems, Tires, Tune-Ups, Car Tips and Contact.

I want to be careful here, because I do not know why it stopped. There is no error page
saying what happened. Hosting lapsed, a renewal bounced, a database did, someone deleted a
record — I have no way to know from outside, and I am not going to invent a reason in a
document asking you to trust my judgment.

What I can tell you is that the fix is bounded. Your domain, your hosting and your email
are all intact. Whatever happened, the recovery is not a rebuild of a business — it is a
repair of an asset you already own.

---

## Why the cheap fix is a trap

This is the part I most want you to read, and it is the reason I am writing this at length
instead of sending a screenshot.

There is an obvious ten-minute fix available to you. You log into the DreamHost panel where
your email already works, you add an A record pointing at your server, and the error message
disappears. It will feel like the problem is solved, because the error will be gone.

What you will have done is put a 2018-era WordPress site — sliders, page builder, plugin
payload — back in front of your customers. On a phone, which is where the large majority of
people who need a mechanic decide anything, that site will be slow, it will have a menu
built for a desktop, and it will have none of the things that actually make somebody call
you: a straight answer about what you do, a price conversation, a way to reach a person, and
your own photographs at a size you can actually see.

You will have spent a year on a site that is worse than no site, because "no site" at least
sends people to your Google listing, where your reputation is. And then the renewal comes
around again and you are back here, except this time you have also spent a year on the wrong
answer and have less reason to trust the next one.

**The reason hiring a developer is necessary here is not that this is hard.** Adding a DNS
record is genuinely easy and I am not going to pretend otherwise. It is necessary because
the two things — making the error go away, and making the site good enough to convert a
worried person on a phone into a phone call — are completely different jobs, they look
identical from the outside, and the first one is the trap that costs you the most.

That is the whole case for hiring someone. Not because you are not capable. Because the
failure mode here is not visible from where you are standing.

---

## The clock, since it is real

**2027-05-10** is when `aplusauto.org` renews. That is roughly seven and a half months from
today. It is a routine renewal that will most likely process automatically and cost you
nothing, and I am not raising it because I think you will lose the domain.

I am raising it because it is the one hard date in this document, and because "we'll look at
the website after the busy season" is how a seven-month deadline becomes a seven-year one.
If the site is going to be right, the time to build it is a quiet week, not a week where
you are already underwater with cars in the bays.

---

## Why this is about growth, not about looking nice

You asked about scaling up and about being found. Here is the honest version of that, without
the marketing gloss.

**Your reputation is not the bottleneck. Your reputation is already working.** You have
earned reviews, you have a Google profile, you have a Facebook presence, and people in St.
Ann, Florissant, Bridgeton and Overland already know you exist or are one search away from
finding out. You do not need a website to become a good shop.

What the dark domain costs you is the last step. Consider the actual sequence a person goes
through when their car starts making a noise they have never heard before:

1. They search, or they open the listing they already trust. **You are found here.**
2. They read the reviews, the hours, the address. **They are reassured here.**
3. They decide you are real, and they try to find more. They look for a website, because
   that is what people do, and because a business with no site reads as a business that may
   not still be there.
4. They type `A+ Auto Repair`, or they tap your own domain.

**Step 4 is where you lose them.** The person is already interested. The work of selling
them is already done by your reputation. All that is left is a page that confirms the shop
still operates, and instead there is an error. They do not think "this shop has a technical
problem." They think "this place might be closed," and they call the next result.

That is the growth problem, and it is narrow and specific: **you have earned the click and
you are not there to catch it.** A working site does not create demand. It stops leaking the
demand your reputation already created.

**And it compounds in one direction.** Every month the domain serves nothing is a month
where your own name, typed by someone who already likes you, leads to an error. That is a
slow leak rather than a sudden loss, which is exactly why it is easy to sit on. But it is
compounding.

**The second growth argument is one you can act on immediately.** You are holding a domain
you cannot currently use. That is fourteen years of paid hosting on an asset that is
contributing nothing. Either it works, or it is an ongoing expense, and there is no version
of this where doing nothing is free.

---

## What "hiring a developer" actually means for you

I want to be concrete, because "hire a web guy" is vague enough that you should assume the
worst.

For your site, scoped to what I would actually do:

- **A real page, built to be found.** Your name, your services, your address, your hours,
  your phone, in the words people use when they describe the problem. Structured so search
  engines can read it. Fast on a phone, because that is where your customers are.
- **Your own photographs, at full size.** These already exist. I pulled your business's
  actual photographs off your own Google Business Profile while preparing this — the
  storefront after dark, the cars up on the lifts, a hood open with somebody's hands on it.
  They are good, they are yours, and right now they live on a profile somebody else controls.
  A site is how you put them somewhere that is yours.
- **A click-to-call button** that works on a phone, because on a mobile page a phone number
  is the single most valuable thing on the screen.
- **Your hours and location, correct and current**, so nothing sends a customer to a closed door.
- **The DNS repair, done correctly**, including whatever it takes to make sure it is not the
  thing that breaks next time.
- **The code, handed to you.** It is yours, on your domain, in files you can read and give
  to anyone. No proprietary system, no lock-in, no monthly fee to keep a page online.
- **A place for your reviews**, so the reputation you have actually earned is visible on
  your own site and not only on a platform that can change its rules on you.

That is the work. It is not a retainer. It is a fixed price, defined up front, for a
finished site you own outright.

---

## Six months of maintenance, free

**This is the part that should make the decision easy.**

The build is the part everyone quotes. The part that decides whether you are happy a year
from now is what happens at 11pm on a Saturday, six months in, when something is wrong and
you find out your developer has moved on to somebody else and does not answer.

So: **six months of maintenance and debugging, included, at no cost.** It starts the day
the site goes live on your own domain.

**What that covers, for six months, free:**

- **Anything breaks on the site — I fix it.** Page goes down, layout breaks on a new phone,
  the reviews feed stops, images do not load, a form quits sending. You tell me it is wrong
  and it gets fixed. You do not get an invoice and you do not get asked to pay a diagnostic
  fee to find out what is wrong.
- **Your review feed stays live.** I set the Google key up so it runs without you thinking
  about it. If Google changes something on their end, I fix it so the feed keeps working.
- **The DNS stays pointed.** This is the one that matters most, and it is the one that
  silently kills sites. I check that the records are still correct and that the certificate
  is renewing. **A certificate that quietly lapses will turn your site into a security
  warning on a phone, and most people read that as "scam website" and leave.**
- **Editing anything you want changed.** Phone number, hours, a service you added, a
  sentence you want reworded, a new photograph. That is maintenance, not a new project, and
  it is included.
- **Being reachable.** If something is wrong, you tell me and it gets dealt with. You are
  not filing a ticket into a void.

**Two things I will be straight about, because a promise with no edges is not a promise.**

**First, what "free" means.** Free means I do not charge you for my time. It does not mean
the site costs nothing to run — hosting, the domain, and the review API have real monthly
costs, and I will show you exactly what they are before you decide, so there are no
surprises in a bill you did not know was coming. Where I can keep a cost at zero I will,
and where I cannot, you will know the number up front.

**Second, where the six months ends.** When it ends, the site does not break and nothing
gets switched off. It keeps running, it keeps working, and the code is still yours — it
always was. What ends is my obligation to be on call. After that you have three options and
you can pick any of them at that point, including doing nothing at all:

1. **I keep maintaining it** on a small monthly plan, and I will quote it then, not now.
2. **You take it** — it is your domain, your hosting account and your code, so you can hand
   it to any developer in the country tomorrow and they can pick it up with no drama. I will
   write a short handover note so whoever it is does not have to reverse-engineer anything.
3. **You stop paying and keep everything**, because there is no lock-in and no hostage
   situation. The worst outcome of this arrangement is that you got six months of free
   maintenance for a site you own.

**Why six months specifically.** It covers two full service cycles at a shop like yours,
including one winter. It is also longer than it takes for most small-business sites to
develop their first real problem, which means we will find the real problems together while
it is still cheap to fix — not in year three.

I would rather give you six months of my time than make an argument about why you should
trust me. The argument is cheap. The six months is not, and it is the one that tells you
something.

---

## Why me, specifically

You should not take this section at face value, so here is the reasoning rather than the
adjectives.

**I did the work before I asked you for anything.** This document exists because I actually
checked your domain, found your site's archive, pulled your own photographs, and wrote a
working page for your business before you agreed to talk to me. I did not find you in a
directory and mail you a template. Most of what a contractor could have sold you without
lifting a finger, I have already done and am handing you regardless of what you decide.

**I told you what I could not verify, because the alternative is worse than losing this deal.**
Further down there is a list of things I could not confirm. I am publishing it anyway, in a
document whose whole purpose is to establish that I can be trusted with your business. A
person who cannot be trusted does not volunteer the gaps.

**I am local and reachable.** I am in Florissant. If something breaks at 4pm on a Tuesday,
I am not a support ticket number in another time zone.

**I have done the emergency version of this before.** A St. Louis clinic had a site go dark
last year; it was back up that evening, on their own domain, taking bookings again. That is
the same failure mode as yours, in the same county, and it is documented publicly at
**webrehabstl.pages.dev**.

**I do not want a subscription.** My published launch price is **$1,200**, fixed, and the
code is yours at the end of it. I would rather do four good projects than hold a small
business on a monthly plan it does not need.

**And I am not the only option, and you should compare.** I would rather you checked two
other people and picked the better fit. If you do that and choose them, this document was
still worth the ten minutes it cost me.

---

## What I need from you to start

This is genuinely small, and you can have all of it in one text message:

1. **Access to your domain and hosting** — the DreamHost login, or whoever set it up.
2. **Your current hours**, confirmed. Mine came from your public listings and may be stale.
3. **Anything you want said about the shop** — who you are, what you take pride in, whether
   you want to be direct about pricing or not. This is the part that makes it yours rather
   than mine, and it is the part I most want your words on.
4. **Which photos you want** — I have a set pulled from your own profile, but you decide
   what goes on your site.
5. **A decision on the reviews.** See the next section, because there is a real choice
   here and I do not want to make it for you.

---

## The reviews question, honestly

Reviews are the strongest asset you have, and they currently live entirely on platforms you
do not control. Putting them on your own site is the highest-value thing on this list. But
I want to be straight about the mechanics rather than hand you a widget that looks broken.

**The realistic option is a live feed from Google.** Google has an API that returns your
actual reviews, your actual rating, and your actual review count, straight from your listing
— genuinely real-time, and updated as people post them. It requires an API key on a Google
Cloud account, which is free to set up, and it has to stay on the server rather than in the
page. It also obliges me to display Google's attribution and link back to them, which is
fine, and to respect their rules about how long I can cache the data, which is also fine.

**If you do not have that key yet,** the honest version is that I build and wire the whole
thing, it is ready the moment the key exists, and until then the site shows nothing in that
space rather than something fake. The alternative — a review box that shows placeholder
quotes, or five gold stars, or a "4.9 from 100+ customers" banner — is invented praise
about your business, and I am not going to put your name on it.

**A number I will not put in this document:** your exact review count. I have seen at least
two different figures from two different aggregators, and they disagree. The rating and the
count on your Google profile are the only numbers that count, and I am not going to quote
you a figure I cannot source from Google itself. When the feed is live, it will be your real
number, and it will be right.

---

## What I have not verified

Published deliberately. If you are deciding whether to trust me, the useful information is
not only what I found — it is what I could not.

- **I could not verify your Google place ID against Google.** I found an ID for your
  business on a third-party aggregator, and I have not confirmed against Google's own API
  that it resolves to A+ Auto Repair at your address. When the live feed is switched on, I
  will confirm the feed is returning *your* reviews before I call it done.
- **I do not know why the site went down.** I have a last-known-good date of 2025-07-12 and
  nothing on the domain that explains the gap. It could be a lapsed renewal, a deleted DNS
  record, a database issue. I am not guessing.
- **I have not seen your old site render.** I can read its archived structure and its
  content, but I cannot load it, so I am not going to describe to you what it looked like or
  criticise something I have not seen.
- **I do not know your traffic, and I am not going to estimate it.** I do not know how many
  people bounce off that domain each month. I have deliberately not put a number on that
  anywhere above, because a fabricated traffic figure is the easiest way for a sales
  document to become a lie.
- **I cannot tell you what you are ranked for,** or what your competitors are doing. I have
  not run that analysis and you should be sceptical of anyone who claims otherwise about
  your specific keywords.

If any of those matter to your decision, ask me and I will go get the answer. If I cannot
get it, I will tell you that too.

---

## The ask

You do not have to decide anything today.

Two options, and the second one costs you nothing but a text message:

**Option one — just reply.** Tell me who you are, and I will send you the login steps. If
you would rather just have the site back and skip the rest of this conversation, that is a
completely reasonable way to handle it.

**Option two — look at what this would look like first.** I have already built a working
page for A+ Auto Repair using your own name, your own address, your own hours, your own
photographs and your own services. It is live at **aplusauto.pages.dev** and you can open it
on your phone, which is the device that matters. It is not a screenshot and not a mock — it
is the actual page, running. Have a look, then decide whether you want me to put it on your
domain.

Either way, you keep everything either way. The photographs, the research, the archive of
your own site, and the page itself. It is yours whether or not you hire me, because it is
the fastest way I know to show you what I mean.

---

Jake Viefhaus
Florissant, Missouri
webrehabstl.pages.dev
