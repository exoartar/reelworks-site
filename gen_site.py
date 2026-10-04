import html, json, hashlib, os

# Cache-busting: asset links carry a hash of the file contents.
def _fp(path):
    try:
        return hashlib.md5(open(path, "rb").read()).hexdigest()[:10]
    except OSError:
        return "0"
CSS_V, JS_V = _fp("assets/site.css"), _fp("assets/site.js")

# ---- settings: change these, then run  python gen_site.py
SERVICE = "https://fischxr-api.exoartar.workers.dev"   # your FISCHXR service (live numbers, download counting)
VERSION = "5.7.3"                                       # shown on the download buttons
TRAILER_YT = ""                                         # a YouTube video ID for the trailer, e.g. "dQw4w9WgXcQ"; empty = "coming soon"
SITE_URL = "https://reelworks.pages.dev"                                           # the site's address once it's online, e.g. "https://reelworks.pages.dev" (for link previews)

# The team, for the About page, top of the hierarchy first. "level" 1 is the
# top; people on the same level sit side by side. "discord" is their Discord
# user ID: the picture comes from their Discord profile (through the service).
# "picture" (a file in assets/team/ or a web address) overrides it if set.
TEAM = [
  {"level": 1, "name": "Silver :3", "role": "ReelWorks", "about": "Leads ReelWorks.", "discord": "938088453453803551", "picture": ""},
  {"level": 2, "name": "Exoartar", "role": "Development Lead", "about": "Builds FISCHXR and keeps it working with every Fisch update.", "discord": "1531039490678980741", "picture": ""},
  {"level": 3, "name": "Jester", "role": "Lead Tester", "about": "Fishes with every build before it ships.", "discord": "776112976075423756", "picture": ""},
]
ROLE_COLOURS = {"ReelWorks": "#FFC940", "Development Lead": "#A970FF", "Lead Tester": "#3FE0F0"}

DISCORD_CLIENT_ID = "1552771662787903568"              # the FISCHXR Discord app (for "Sign in with Discord")
DISCORD_SERVER_ID = "1552635887089745982"              # the FISCHXR server (roles and boosts on the profile page)
# FISCHXR roles shown on profiles: [Discord role id, name, color] (the same list the macro uses)
PROFILE_ROLES = [["1552797683012472943", "Macro Developer", "#A970FF"], ["1552797570269712485", "Macro Creator", "#FFC940"],
                 ["1553164118792601690", "Macro Tester", "#3FE0F0"], ["1552813077072715786", "Content Creator", "#FF4FD8"]]

DL = SERVICE + "/download"                              # counted, then sent on to the file (see the service README)
DISCORD = "https://discord.gg/ERkjTTYG4B"
ICON = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v9m0 0l-4-4m4 4l4-4M4 15h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
PAGES = (("home", "index.html", "Home"), ("rods", "rods.html", "Rods"), ("features", "features.html", "Features"), ("leaderboard", "leaderboard.html", "Leaderboard"), ("players", "players.html", "Players"), ("changelog", "changelog.html", "Changelog"), ("about", "about.html", "About"))

def head(title, desc, page):
    nav = ""
    for key, href, name in PAGES:
        cur = ' aria-current="page"' if key == page else ""
        nav += '<a href="%s"%s>%s</a>' % (href, cur, name)
    return """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#000000">
<meta name="color-scheme" content="dark">
<title>%s</title>
<meta name="description" content="%s">
<meta property="og:site_name" content="FISCHXR by ReelWorks">
<meta property="og:title" content="%s">
<meta property="og:description" content="%s">
<meta name="twitter:card" content="summary">
%s<link rel="icon" href="assets/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css?v=%s">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="progress" aria-hidden="true"></div>
<div class="bar">
  <div class="wrap">
    <a class="brand" href="index.html"><img src="assets/logo.png" alt=""><span><b>FISCHXR</b> <small>by ReelWorks</small></span></a>
    <nav aria-label="Pages">%s</nav>
    <div class="acts"><a class="quiet" href="%s">Discord</a><a class="signin" id="signin" href="profile.html">Sign in</a><a class="btn white" href="download.html">Download</a>
      <button class="menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button></div>
  </div>
</div>
<nav class="mnav" id="mnav" aria-label="Pages">%s<a href="download.html">Download</a><a href="profile.html">Your profile</a><a href="%s">Discord</a></nav>
<main id="main">
""" % (title, html.escape(desc), html.escape(title), html.escape(desc),
       ('<meta property="og:image" content="%s/assets/logo.png">\n' % SITE_URL.rstrip("/")) if SITE_URL else "", CSS_V, nav, DISCORD, nav, DISCORD)

FOOT = """</main>
<footer>
  <div class="wrap">
    <div>
      <p class="by">FISCHXR is made by ReelWorks.</p>
      <p>Made by fans, not affiliated with Roblox or the makers of Fisch. Macros can break game rules, so use it at your own risk.</p>
    </div>
    <nav aria-label="Footer links"><a href="rods.html">Rods</a><a href="features.html">Features</a><a href="download.html">Download</a><a href="%s">Discord</a></nav>
  </div>
</footer>
<script>window.FX = %s;</script>
<script src="assets/site.js?v=%s"></script>
</body>
</html>
""" % (DISCORD, json.dumps({"service": SERVICE.rstrip("/"), "client": DISCORD_CLIENT_ID, "server": DISCORD_SERVER_ID,
                            "version": VERSION, "roles": PROFILE_ROLES}), JS_V)

def getblock(live=False):
    strip = ""
    if live:
        strip = """
      <div class="livestrip" aria-label="Live numbers">
        <span><b data-live="discord.members">&ndash;</b> Discord members</span>
        <span><i class="livedot" aria-hidden="true"></i><b data-live="discord.online">&ndash;</b> online</span>
        <span><b data-live="fishing">&ndash;</b> fishing now</span>
        <span><b data-live="downloads">&ndash;</b> downloads</span>
      </div>"""
    return """<div class="get">
      <div class="row">
        <a class="btn white big" href="%s" download>%sDownload for Windows</a>
        <a class="btn ghost big" href="%s">Join the Discord</a>
      </div>
      <p class="fine">Version %s. Free. One file, nothing else to install.</p>%s
    </div>""" % (DL, ICON, DISCORD, VERSION, strip)

RODS = [
  ("noiseform", "Noiseform", "#3FE0A0", "Has a glowing emblem behind the bar and flashes colored warnings that name a zone. FISCHXR reads the warning and moves the bar to that zone."),
  ("pinion", "Pinion's Aria", "#A98BFF", "Drops notes onto the reel while you're reeling. FISCHXR catches them without losing the fish."),
  ("verdant", "Verdant Oath", "#6BE04A", "The bar is wooden blocks around a green zone that shrinks as the reel goes on, and touching the wood costs progress. FISCHXR keeps the fish in the green."),
  ("ruinous", "Ruinous Oath", "#FF4040", "The bar shrinks and shifts from white to deep red, with slashes hitting it now and then. FISCHXR tracks the bar through every color."),
  ("luminescent", "Luminescent Oath", "#4F8BFF", "Works like Ruinous Oath, except the bar turns blue."),
  ("poseidon", "Poseidon's Lance", "#3FA8FF", "Has a blue sweet spot in the middle of the bar. FISCHXR reads the whole bar and keeps the fish on the blue."),
  ("bellona", "Bellona's Waraxe", "#FF6A3A", "Runs two reels at once, one on each mouse button, and FISCHXR steers both."),
  ("apollo", "Apollo's Sunshot", "#FFA640", "The bar goes nearly black whenever the fish slips out of it. FISCHXR keeps tracking it anyway."),
  ("cinder", "Cinder Block Rod", "#BDBDBD", "The bar fills the whole track and never moves, so there's nothing to steer. FISCHXR waits for the reel to finish."),
  ("requiem", "Requiem", "#35D07F", "Has its own reel style. It's supported, and we're still improving it."),
  ("splitbranch", "Splitbranch Twig", "#C79463", "Uses a non-standard reel that FISCHXR handles separately. Tested and working."),
]

def shelf():
    out = ""
    for rep in (0, 1):
        for rid, name, col, *_ in RODS:
            hide = ' aria-hidden="true" tabindex="-1"' if rep else ""
            alt = "" if rep else html.escape(name)
            out += '    <a href="rods.html#%s" data-c="%s"%s><img src="assets/renders/%s.png" alt="%s" loading="lazy">%s</a>\n' % (rid, col, hide, rid, alt, html.escape(name))
    return out

def rod_article(rid, name, col, text):
    tag = '<span class="tag">improving</span>' if rid == "requiem" else ""
    return """  <article class="rod reveal" id="%s" data-c="%s">
    <div class="art"><img class="tilt" src="assets/renders/%s.png" alt="%s" loading="lazy"></div>
    <div>
      <h2>%s%s</h2>
      <p>%s</p>
    </div>
  </article>
""" % (rid, col, rid, html.escape(name), html.escape(name), tag, text)

CHECK = '<svg viewBox="0 0 20 20" aria-label="Yes"><path d="M4 10.5l4 4 8-9" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
CROSS = '<svg class="no" viewBox="0 0 20 20" aria-label="No"><path d="M5.5 5.5l9 9m0-9l-9 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
CMP = [
  ("Casting, shaking and reeling", 1, 1),
  ("Every special rod", 1, 1),
  ("Totems, aquarium and Sovereign", 1, 1),
  ("Rejoins after a disconnect", 1, 1),
  ("Discord alerts, <kbd>/start</kbd> and <kbd>/stop</kbd>", 1, 1),
  ("Fishing goals that ping you", 0, 1),
  ("Catch rate on the fishing panel", 0, 1),
]
def trailer():
    if TRAILER_YT:
        return ('<div class="trailer"><iframe src="https://www.youtube-nocookie.com/embed/%s?rel=0" title="FISCHXR trailer" loading="lazy" '
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>' % html.escape(TRAILER_YT))
    return ('<div class="trailer soon" role="img" aria-label="Trailer coming soon"><div class="play" aria-hidden="true"></div>'
            '<p><b>Trailer coming soon</b>Watch this space.</p></div>')

def compare():
    lbl = "".join('<div class="cell">%s</div>' % l for l, f, p in CMP)
    def cells(which):
        out = ""
        for l, f, p in CMP:
            yes = f if which == "free" else p
            out += '<div class="cell">%s<span class="sr">%s</span></div>' % (CHECK if yes else CROSS, "Included" if yes else "Not included")
        return out
    return """<div class="chart-scroll"><div class="chart" role="group" aria-label="FISCHXR and FISCHXR Plus compared">
      <div class="col lbl"><div class="cell head"></div>%s<div class="cell foot"></div></div>
      <div class="col"><div class="cell head"><span class="name">FISCHXR</span><span class="price">Free</span><span class="small">Everything that fishes</span></div>%s<div class="cell foot"><a class="btn ghost" href="%s" download>Download free</a></div></div>
      <div class="col plus"><span class="badge">For boosters</span><i class="sp"></i><i class="sp"></i><i class="sp"></i><i class="sp"></i><i class="sp"></i>
        <div class="cell head"><span class="name">FISCHXR Plus</span><span class="price pink">Plus</span><span class="small">Boost the Discord server</span></div>%s<div class="cell foot"><a class="btn pinkb" href="%s">Boost for Plus</a></div></div>
    </div></div>""" % (lbl, cells("free"), DL, cells("plus"), DISCORD)

home = head("FISCHXR by ReelWorks, a fishing macro for Fisch", "FISCHXR fishes Fisch for you, special rods included. Made by ReelWorks. Free.", "home") + """
<div class="wrap">
  <div class="top">
    <canvas id="motes" aria-hidden="true"></canvas>
    <h1>Press F1 and go do something else</h1>
    <p class="lede">FISCHXR fishes Fisch for you, <b>special rods included</b>.</p>
    """ + getblock(live=True) + """
    <div class="live" aria-label="A live example of the bar following the fish">
      <div class="head"><span><span class="dot"></span><b>Reeling</b><span class="rod-now" id="rodnow">Standard rod</span></span><span id="caught">0 caught</span></div>
      <canvas id="reel" role="img" aria-label="A reel: a white bar steers itself onto a fish as it moves along the track."></canvas>
    </div>
  </div>
</div>

<div class="shelf" aria-label="Rods FISCHXR handles">
  <div class="track">
""" + shelf() + """  </div>
</div>

<div class="wrap">
  <section class="centered reveal">
    <h2>Built for special rods</h2>
    <p class="sub">Several rods have their own reel mechanics. FISCHXR supports them.</p>
    <p style="margin-top:26px"><a class="btn ghost" href="rods.html">See the rods</a></p>
  </section>

  <section class="reveal">
    <div class="feat">
      <div class="words">
        <h3>More than reeling</h3>
        <p>It also handles totems, your aquarium and Sovereign, and sends Discord alerts when something needs your attention.</p>
        <p><a class="btn ghost" href="features.html">See the features</a></p>
      </div>
      <img src="assets/app/totems.png" alt="FISCHXR's Totems page" loading="lazy">
    </div>
  </section>

  <section class="reveal">
    <div class="count">
      <div><b data-live="users">&ndash;</b><span>people using FISCHXR</span></div>
      <div><b data-to="11">0</b><span>special rods handled</span></div>
      <div><b data-to="214">0</b><span>checks before every release</span></div>
    </div>
  </section>

  <section class="centered reveal">
    <h2>Trailer</h2>
    <p class="sub" style="margin-bottom:34px">A minute of FISCHXR fishing on its own.</p>
    """ + trailer() + """
  </section>

  <section class="reveal">
    <div class="lbhead"><div><h2>Top anglers this week</h2><p class="sub">Reels with FISCHXR since Monday.</p></div><a class="btn ghost" href="leaderboard.html">Full leaderboard</a></div>
    <ol class="board mini" id="board-mini" data-period="week" data-limit="5"><li class="empty">Loading&hellip;</li></ol>
  </section>

  <section id="plus" class="centered reveal plus-sec">
    <h2>Free and <span class="pink">Plus</span></h2>
    <p class="sub">Everything that fishes is free. Boost the Discord for a few extras.</p>
    """ + compare() + """
  </section>

  <section class="reveal">
    <div class="maker">
      <p><b>Made by ReelWorks.</b> A rod giving it trouble? Send us a clip in the Discord.</p>
      <a class="btn ghost" href=\"""" + DISCORD + """\">Join the Discord</a>
    </div>
  </section>

  <section class="centered reveal">
    <h2>Get FISCHXR</h2>
    <p class="sub" style="margin-bottom:28px">One file, and setup takes a couple of minutes.</p>
    """ + getblock() + """
  </section>
</div>
""" + FOOT

rods = head("Rods | FISCHXR by ReelWorks", "The rods FISCHXR handles, and what's different about each one's reel.", "rods") + """
<div class="wrap">
  <div class="top">
    <h1>Supported rods</h1>
    <p class="lede">Standard rods just work. These have reels of their own.</p>
  </div>
  <div class="rodgrid stagger">
""" + "".join('    <a href="#%s" data-c="%s"><img src="assets/renders/%s.png" alt="" loading="lazy">%s</a>\n' % (r[0], r[2], r[0], html.escape(r[1])) for r in RODS) + """  </div>
</div>
<div class="wrap" style="margin-top:80px">
""" + "".join(rod_article(*r) for r in RODS) + """  <section class="centered reveal" style="padding-top:60px">
    <h2>Don't see your rod?</h2>
    <p class="sub" style="margin-bottom:26px">Send us a recording of a few reels in the Discord and we'll look at adding it.</p>
    <a class="btn ghost big" href=\"""" + DISCORD + """\">Join the Discord</a>
  </section>
</div>
""" + FOOT

FEATS = [
  ("totems", "Totems", "Totems", "Add the totems you own and set when each one should be used. FISCHXR uses them between catches."),
  ("aquarium", "Aquarium", "Aquarium", "Set how often to feed it, how much food to use and how many to buy per visit. FISCHXR makes the trip between catches."),
  ("sovereign", "Sovereign", "Sovereign recharging", "Recharges Sovereign with plain Enchant Relics every set number of reels. Mutated relics are never used."),
  ("alerts", "Alerts", "Discord alerts", "Sends messages to your Discord channel for problems, disconnects, starts and stops, plus an hourly summary. <kbd>/start</kbd> and <kbd>/stop</kbd> work from your phone."),
  ("reel", "Reel", "Reel settings", "Control style, latency, braking and look-ahead can all be adjusted. The defaults work well for most people."),
]
feats = head("Features | FISCHXR by ReelWorks", "Everything FISCHXR does around the fishing: totems, aquarium, Sovereign, Discord alerts and more.", "features") + """
<div class="wrap">
  <div class="top">
    <h1>Features</h1>
    <p class="lede">Everything FISCHXR does besides reeling.</p>
  </div>
""" + "".join("""  <section class="reveal">
    <div class="feat%s">
      <div class="words"><h3>%s</h3><p>%s</p></div>
      <img src="assets/app/%s.png" alt="FISCHXR's %s page" loading="lazy">
    </div>
  </section>
""" % (" flip" if k % 2 else "", t, p, img, label) for k, (img, label, t, p) in enumerate(FEATS)) + """  <section class="reveal">
    <div class="maker">
      <p><b>Also included:</b> it rejoins if Roblox disconnects you and updates itself. Server boosters get Plus, which adds fishing goals that stop the macro and ping you when they're reached.</p>
      <a class="btn ghost" href="download.html">Get FISCHXR</a>
    </div>
  </section>
</div>
""" + FOOT

dl = head("Download | FISCHXR by ReelWorks", "Download FISCHXR for Windows: one file, free.", "download") + """
<div class="wrap">
  <div class="top">
    <img src="assets/logo.png" alt="" style="width:84px;height:84px;border-radius:18px;margin:0 auto 26px">
    <h1>Download FISCHXR</h1>
    <p class="lede">For Windows 10 and 11. One file, free, nothing else to install.</p>
    <div class="get">
      <a class="btn white big" href="%s" download>%sDownload for Windows</a>
      <p class="fine">Made by ReelWorks.</p>
    </div>
    <ol class="steps reveal">
      <li><b>Open it.</b> Save it anywhere and double-click.</li>
      <li><b>Sign in with Discord,</b> or carry on as a guest.</li>
      <li><b>Press <kbd>F1</kbd> in Fisch.</b> Again to stop.</li>
    </ol>
    <div class="note reveal">
      <p style="margin:0"><b>Windows may warn you the first time.</b> On the blue "Windows protected your PC" box, choose <b>More info</b>, then <b>Run anyway</b>. Unsure? Ask in the <a href="%s" style="border-bottom:1px solid var(--line)">Discord</a>.</p>
    </div>
  </div>
</div>
""" % (DL, ICON, DISCORD) + FOOT

for name, text in (("index.html", home), ("rods.html", rods), ("features.html", feats), ("download.html", dl)):
    open(name, "w", encoding="utf-8").write(text)
open("download/PUT-FISCHXR.EXE-HERE.txt", "w").write("Put the FISCHXR.exe you want people to download in this folder.\nEvery Download button on the site points at download/FISCHXR.exe.\n")
print("pages written")

CHANGELOG = json.loads(r'''[{"v": "5.7.3", "items": ["FISCHXR.exe now updates itself, like the script version: \"Update now\" downloads the new FISCHXR.exe, checks its fingerprint, swaps itself for it and restarts. If its folder can't be written to, the download page opens instead, as before."]}, {"v": "5.7.2", "items": ["Dark or tinted lighting: when something dims or colors the whole reel (a dark event, a night filter, HDR or a graphics filter), FISCHXR could see nothing at all. It now notices the reel looks dimmed or tinted, corrects its colors, and reads it as normal. Your event log says when it does."]}, {"v": "5.7.1", "items": ["Ordinary rods no longer mistake bright blue, lavender or pink scenery for the bar (it could show the whole track as bar). The changing colors of Ruinous Oath, Luminescent Oath and Poseidon's Lance now only count when that rod is equipped."]}, {"v": "5.7.0", "items": ["Catch log: after each reel FISCHXR reads the catch message (the fish, its weight and its 1-in-N odds) and keeps Catches.csv next to the macro. Turn it off with Read each catch on the Reel page.", "Rare catches (1 in 100 or rarer) go to the FISCHXR Discord when you're signed in: the rarest are posted in the server, and /catch-alerts sends you a DM when your macro catches something rare. If you've hidden yourself from the leaderboards, your catches aren't posted publicly."]}, {"v": "5.6.0", "items": ["Leaderboards: when you're signed in with Discord, your reels count toward the weekly and all-time FISCHXR leaderboards on reelworks.pages.dev and in the Discord bot (/leaderboard). Don't want to be on them? Use /leaderboard-visibility in Discord, or the switch on your profile page on the website.", "While fishing, FISCHXR tells the FISCHXR service how it's doing every 10 minutes, so the website's live numbers and the leaderboards stay current."]}, {"v": "5.5.0", "items": ["FISCHXR comes as a single FISCHXR.exe from reelworks.pages.dev, with nothing else to install. When a new version is out, the .exe takes you to the download page."]}, {"v": "5.4.9", "items": ["Poseidon's Lance: its bar is read whole, blue sweet spot included (before, FISCHXR saw only one white end of it and steered the wrong part of the bar), and the fish is kept near the middle, on the blue."]}, {"v": "5.4.8", "items": ["Bellona's Waraxe: each reel on its own mouse button, as the game has it: the left reel on the left button, the right reel on the right button, steered at the same time; the right reel is kept on after the left one ends.", "Luminescent Oath: its bar is followed from white through lavender to deep blue.", "Verdant Oath: the bar is found when a wooden block hangs past either end of the reel, and when it touches an end its green zone decides where it is.", "Cinder Block Rod: its bar fills the reel and never moves, and FISCHXR no longer takes that for scenery and ends the reel."]}, {"v": "5.4.7", "items": ["Apollo's Sunshot: its bar is followed when it turns nearly black (the fish outside it). Before, FISCHXR could go blind for seconds while the fish got away."]}, {"v": "5.4.6", "items": ["Bellona's Waraxe: both reels are worked. FISCHXR finds the two tracks where they really are on your screen (any resolution), takes turns between the two fish when they can't both be kept, and reads both reels in one capture.", "Reel records now show how fast each reel was read (frames a second, and time spent capturing and reading), to tune slower PCs."]}, {"v": "5.4.5", "items": ["Apollo's Sunshot: its bar is followed in its dark look too (the fish outside it). Before, FISCHXR lost the bar then and could end the reel early.", "Starting to fish closes any open dialog, so an update prompt can't sit over the game while you fish; it's asked again when you stop."]}, {"v": "5.4.4", "items": ["Settings has an \"Open snapshots folder\" button: your saved snapshots and reel records, one click away."]}, {"v": "5.4.3", "items": ["Verdant Oath: FISCHXR follows its bar as it grows in and shrinks during the reel. Before, it took the bar's size from the first moments of the reel and then ignored most of the real bar as \"the wrong size\", steering blind for much of each reel."]}, {"v": "5.4.1", "items": ["Display names in fancy Unicode letters show properly on your profile."]}, {"v": "5.4.0", "items": ["Your profile shows your Discord banner across the top, with your picture over its edge, and your numbers count up when it opens.", "Plus goals: stop fishing after so many catches or so many minutes (on the Fishing page), with a Discord alert when a goal is reached. The stop alert now carries your session summary with catches per hour.", "A taller fishing panel that shows your rod: Pinion's Aria's notes falling, Noiseform's warning color and the zone it wants, both of Bellona's Waraxe reels."]}, {"v": "5.3.1", "items": ["Bellona's Waraxe: both of its reels are read. FISCHXR watches the two tracks side by side, keeps both fish under the bar when they fit, follows the nearer one when they don't, and carries on with the one that's left when the other finishes.", "Rounded buttons everywhere: every button, choice, key, stepper and totem chip is drawn rounded."]}, {"v": "5.3.0", "items": ["Start and stop fishing from Discord with /start and /stop (your macro answers within about 45 seconds).", "Ruinous Oath is followed all the way: its bar turns from white to pink to red as it shrinks, and FISCHXR now knows every shade of it.", "Updates always come from the official FISCHXR GitHub; the update link can no longer be changed."]}, {"v": "5.2.9", "items": ["Noiseform: the bar is measured fresh on every reel. Its width changes from fish to fish, and reusing an earlier reel's width could make FISCHXR read part of the green emblem as the bar (and lose the fish).", "Noiseform: a bar reading that doesn't move while the mouse is held or let go is ignored (the bar always moves then), and a \"fish\" that's really part of the reel's fixed picture is ignored too."]}, {"v": "5.2.8", "items": ["Noiseform: the bar is found when it's pushed against either end of the reel (its outline merges with the reel's border there). Before, FISCHXR lost it there, so when a zone warning came it couldn't take the bar to the zone."]}, {"v": "5.2.7", "items": ["Noiseform: FISCHXR knows when the reel is over again. 5.2.6 could keep \"seeing\" a bar in the scenery after the catch; now once the reel's track and emblem are gone, nothing there counts as a bar."]}, {"v": "5.2.6", "items": ["Noiseform: FISCHXR now follows the bar when it goes dark (the fish outside it). It learns what the reel looks like behind the bar, the green emblem included, and finds the dark bar as what stands out from that, instead of mistaking the emblem for the bar."]}, {"v": "5.2.5", "items": ["Noiseform: the bar's own outline is no longer mistaken for the fish. With a rod's bright effects beside it, the macro could chase its own bar to the end of the track."]}, {"v": "5.2.4", "items": ["The profile's picture, cards and buttons, and the reel gauges, are sized right on screens with display scaling (125%, 150%...): no more small cards or blurry buttons."]}, {"v": "5.2.3", "items": ["Your profile shows your Discord picture again, and your FISCHXR roles (Macro Developer, Macro Creator, Macro Tester, Content Creator).", "The profile's cards and buttons are properly rounded now.", "The reel gauges no longer leave stray marks behind as the bar and fish move."]}, {"v": "5.2.2", "items": ["Your rod is read again every time you start fishing, so a rod you swapped while stopped is picked up straight away. (A rod typed on the Rods page still takes priority.)"]}, {"v": "5.2.1", "items": ["Fast fish are followed instead of lost. When the fish slipped out of the bar, FISCHXR could mistake a stretch of empty track for it and steer the wrong way; now only something fish-sized counts, and it finds the real fish even over the dark track.", "A reel isn't given up on while the bar is still there, even when it's tinted and covering the track's edge.", "Fixed FISCHXR stopping with \"Something went wrong\" after two bad reels in a row."]}, {"v": "5.2.0", "items": ["FISCHXR knows every reel starts with the bar and the fish in the middle. Something that looks like a reel but isn't centred is ignored, and early wrong readings of the fish are no longer believed straight away.", "The reel style can no longer drift to another rod's reel (like a standard rod being read as Noiseform). A style is only switched for a rod whose name isn't known, and only after it fits two reels in a row."]}, {"v": "5.1.9", "items": ["The standard reel keeps track of the bar when it turns red (the fish has slipped out of it), so FISCHXR keeps steering back to the fish instead of losing it."]}, {"v": "5.1.8", "items": ["Catches aren't called early any more. On Noiseform, Pinion's Aria, Requiem, Verdant Oath and Apollo's Sunshot, the fish keeps the reel going while the bar is hard to see (at night, in a zone), and FISCHXR takes one more look before casting, so it never casts over a reel that's still going.", "Your rod is always read from your rod key's slot, even when another slot is highlighted or the hotbar is a different size on your screen."]}, {"v": "5.1.7", "items": ["The boost check no longer depends on the FISCHXR invite link."]}, {"v": "5.1.6", "items": ["The FISCHXR team can now lock a version of FISCHXR to a Discord role (for test builds and early access). If your version is locked and you don't have the role, FISCHXR tells you so, and opens by itself as soon as you get it."]}, {"v": "5.1.5", "items": ["Rounded buttons all through FISCHXR.", "Your profile is now a full page: click your name in the sidebar, and Back takes you where you were.", "Pop-up windows and the fishing panel stay where they open.", "After a reconnect, FISCHXR clicks through Fisch's loading screen before it starts fishing again."]}, {"v": "5.1.4", "items": ["Your profile! Click your name in the sidebar to see your Discord picture, name and username, your Plus status, this session's and all-time fishing, and when your Discord account was made. Log out lives there now.", "The top-left corner shows the new FISCHXR logo.", "A blacklisted account now sees a proper blacklist screen saying why, instead of FISCHXR. If the blacklist is lifted, FISCHXR opens signed in on its own."]}, {"v": "5.1.3", "items": ["Totems are safer. If a totem's hotbar key opens a menu instead (say, the Equipment Bag after you've rearranged your hotbar), FISCHXR closes it without clicking, goes back to your rod and tells you to check that key. Before, its click could equip a different rod.", "FISCHXR re-reads your rod after every job and every 15 casts, so a swapped rod is picked up straight away."]}, {"v": "5.1.2", "items": ["Your rod is read correctly on any screen size. FISCHXR now finds the hotbar slot you're holding by its highlight, instead of guessing where slots sit, which could be a whole slot off on 1080p and other screens.", "Small rod names are enlarged more before they're read, so they're read more reliably."]}, {"v": "5.1.1", "items": ["Plus: your catches per hour always show on the fishing panel."]}, {"v": "5.1.0", "items": ["Change your macro's settings right from Discord! Use /settings set in the FISCHXR server and your macro picks it up within a couple of minutes. /settings show and /status tell you how it's doing.", "The FISCHXR team can now give or take Plus, and keep an account from signing in."]}, {"v": "5.0.0", "items": ["Introducing FISCHXR Plus, a thank-you for everyone boosting the FISCHXR Discord server! Sign in with Discord and Plus switches on by itself.", "Plus fishing extras: quick recast, your catch rate on the fishing panel, and a choice of corner for the panel.", "Plus members see \"FISCHXR - PLUS\" across the top.", "Already signed in? Sign in once more so FISCHXR can see you're boosting."]}, {"v": "4.9.6", "items": ["Splitbranch Twig catches are way more reliable. After you pick a fish, its reel waits for a click before it starts (\"Click & Hold Anywhere!\"). FISCHXR now gives it that click right away and won't give up on the reel while it warms up.", "The Splitbranch choice timer is followed all the way down, even as it turns yellow, orange and red."]}, {"v": "4.9.5", "items": ["Splitbranch Twig: FISCHXR now waits for the two-fish choice to finish before it starts reeling, and tries the left fish, then the right, if a click doesn't land.", "After a choice, FISCHXR reels with the mouse clear of the fish you picked, so the clicks actually reach the reel."]}, {"v": "4.9.4", "items": ["FISCHXR now checks which rod you're holding before the first cast, so it knows which reel to expect right from the start.", "Noiseform got a big upgrade: the fish is spotted much more reliably, especially at night and when it's outside the bar.", "New rod: Splitbranch Twig, \"Choose one!\" pick included."]}, {"v": "4.9.3", "items": ["FISCHXR now fixes itself when fishing goes wrong. Two bad reels in a row? It relearns the reel from scratch. A reel it doesn't recognize? It tries every style until one fits. Stuck for two minutes? It resets and re-equips your rod.", "A job that can't finish (like the aquarium) no longer stops you fishing. It simply tries again in 10 minutes.", "The small fishing panel is solid again instead of see-through.", "The new FISCHXR logo is now on your taskbar and tray."]}, {"v": "4.9.2", "items": ["The \"Sign in to use\" panel no longer hides under the sidebar."]}, {"v": "4.9.1", "items": ["The sign-in buttons work properly now.", "Totems are free for everyone, guests included.", "You can type your rod's name on the Rods page, and typos are fine: \"inions air\" becomes Pinion's Aria.", "Rod names read from your hotbar get the same auto-correct."]}, {"v": "4.8.1", "items": ["The sign-in screen now comes first. Pick Discord or guest and you're in."]}, {"v": "4.8.0", "items": ["Sign in with Discord! Signing in unlocks everything and brings you into the FISCHXR Discord server.", "Guests can still fish. Discord alerts, auto-reconnect, the aquarium, totems and Sovereign need a sign-in.", "Your sign-in is remembered securely, and you can sign out any time."]}, {"v": "4.7.0", "items": ["Everything feels smoother: sliding switches, pages that glide in, buttons that fade on hover, and a status dot that breathes while you fish.", "Soft shadows give the window more depth.", "Prefer less movement? Turn on Reduce motion."]}, {"v": "4.6.1", "items": ["The sidebar is snappy again."]}, {"v": "4.6.0", "items": ["A fresh look: the sidebar is now a slim strip of icons that opens when you hover over it.", "New rod: Apollo's Sunshot.", "Bars that grow or shrink mid-reel are followed properly instead of ending the reel early.", "What's new now scrolls."]}, {"v": "4.5.3", "items": ["When the fish hugs either end, the bar now holds it there instead of bouncing off.", "Verdant Oath keeps track of the bar at both ends and through the red flash."]}, {"v": "4.5.2", "items": ["Verdant Oath now aims the fish right at the middle of the green zone."]}, {"v": "4.5.1", "items": ["Requiem: FISCHXR goes easy on the inputs, so the line doesn't snap."]}, {"v": "4.5.0", "items": ["New rod: Requiem."]}, {"v": "4.4.9", "items": ["Pinion's Aria without a skin: the bright red bar is recognized.", "Steadier steering for every rod: no more lurching after a bad reading, and the bar stays calm while the fish is safely inside."]}, {"v": "4.4.8", "items": ["Pinion's Aria without a skin now works.", "Pinion's Aria's bar is followed as it grows and shrinks with the notes."]}, {"v": "4.4.7", "items": ["Pinion's Aria: notes are spotted about a second before they land, so the bar is ready for them."]}, {"v": "4.4.6", "items": ["Pinion's Aria: the bar keeps the fish and still heads over to catch notes in time."]}, {"v": "4.4.5", "items": ["Noiseform and Pinion's Aria reels no longer end early, and dock planks aren't mistaken for a reel."]}, {"v": "4.4.4", "items": ["Pinion's Aria: the red bar is recognized, and the \u6c34 symbol is no longer mistaken for the fish."]}, {"v": "4.4.3", "items": ["Noiseform works at night."]}, {"v": "4.4.2", "items": ["After a Noiseform zone or a Pinion's Aria note, the bar heads straight back to the fish."]}, {"v": "4.4.1", "items": ["Noiseform zones no longer throw off where the bar is."]}, {"v": "4.4.0", "items": ["Noiseform zones: FISCHXR reads the warning in the middle of the screen and moves the bar to the right zone before the beam hits."]}, {"v": "4.3.1", "items": ["Noiseform is found wherever your reel area sits. If a reel isn't recognized, the Detection log explains why."]}, {"v": "4.3.0", "items": ["Pinion's Aria: the bar catches falling notes while keeping the fish.", "FISCHXR reads the rod in your hotbar to pick the right reel style."]}, {"v": "4.2.3", "items": ["Check for updates now tells you what it found, and hover help is back on every page."]}, {"v": "4.2.2", "items": ["Updates now come straight from the FISCHXR GitHub page. FISCHXR checks when it opens and asks before installing."]}, {"v": "4.2.1", "items": ["Noiseform keeps working when its bar goes dark."]}, {"v": "4.2.0", "items": ["We're FISCHXR now! Your settings carry over.", "FISCHXR reads the rod in your hotbar and uses its reel style automatically.", "Verdant Oath aims the fish at the green zone."]}, {"v": "4.1.0", "items": ["A fresh new look, with tabs down the side and a smaller window.", "A small panel in the corner shows what's happening while you fish, with a Stop button.", "Simpler pages, with fine-tuning tucked away under Advanced.", "Sovereign recharge types into the inventory search the way a person would.", "FISCHXR can now update itself."]}]''')

def changelog_page():
    def entry(e, i):
        items = "".join("<li>%s</li>" % html.escape(t) for t in e["items"])
        latest = '<span class="latest">Latest</span>' if i == 0 else ""
        return '<article class="release reveal"><h2>%s%s</h2><ul>%s</ul></article>\n' % (html.escape(e["v"]), latest, items)
    recent = "".join(entry(e, i) for i, e in enumerate(CHANGELOG[:12]))
    older = "".join(entry(e, i + 12) for i, e in enumerate(CHANGELOG[12:]))
    return head("Changelog | FISCHXR by ReelWorks", "Every FISCHXR update, newest first.", "changelog") + """
<div class="wrap">
  <div class="top">
    <h1>Changelog</h1>
    <p class="lede">Every update, newest first. FISCHXR updates itself when a new version is out.</p>
  </div>
  <div class="releases">
""" + recent + """    <details class="older"><summary>Older versions</summary>
""" + older + """    </details>
  </div>
</div>
""" + FOOT

open("changelog.html", "w", encoding="utf-8").write(changelog_page())
open("404.html", "w", encoding="utf-8").write(head("Not found | FISCHXR by ReelWorks", "This page doesn't exist.", "") + """
<div class="wrap">
  <div class="top">
    <h1>Page not found</h1>
    <p class="lede">That page doesn't exist or has moved.</p>
    <div class="get"><div class="row"><a class="btn white big" href="index.html">Back home</a><a class="btn ghost big" href="rods.html">See the rods</a></div></div>
  </div>
</div>
""" + FOOT)
print("changelog and 404 written")

def about_page():
    def card(m):
        col = ROLE_COLOURS.get(m["role"], "#3FE0C8")
        letters = [w[0] for w in m["name"].split() if w[:1].isalnum()][:2]
        initials = "".join(letters).upper() or m["name"][:1].upper() or "?"
        src = m.get("picture") or (SERVICE.rstrip("/") + "/avatar/" + m["discord"] if m.get("discord") else "")
        pic = ('<img src="%s" alt="" loading="lazy" onerror="this.remove()">' % html.escape(src)) if src else ""
        return ('<article class="member lv%d" data-c="%s"><div class="face" style="--c:%s"><span class="initials">%s</span>%s</div>'
                '<p class="role" style="color:%s">%s</p><h3>%s</h3><p>%s</p></article>') % (
                m.get("level", 1), col, col, html.escape(initials), pic, col, html.escape(m["role"]), html.escape(m["name"]), html.escape(m["about"]))
    levels = sorted(set(m.get("level", 1) for m in TEAM))
    rows = []
    for i, lv in enumerate(levels):
        people = [m for m in TEAM if m.get("level", 1) == lv]
        top = ROLE_COLOURS.get(people[0]["role"], "#3FE0C8")
        link = ""
        if i + 1 < len(levels):
            nxt = [m for m in TEAM if m.get("level", 1) == levels[i + 1]][0]
            link = '<div class="link" aria-hidden="true" style="--a:%s;--b:%s"></div>' % (top, ROLE_COLOURS.get(nxt["role"], "#3FE0C8"))
        rows.append('<div class="tier">%s</div>%s' % ("".join(card(m) for m in people), link))
    tree = '<div class="tree reveal">' + "\n".join(rows) + '</div>'
    return head("About | FISCHXR by ReelWorks", "ReelWorks is the team behind FISCHXR.", "about") + """
<div class="wrap">
  <div class="top">
    <h1>The team</h1>
    <p class="lede"><b>ReelWorks</b> builds and looks after FISCHXR: the macro, its Discord bot and this site.</p>
  </div>

  <section>
    """ + tree + """
  </section>

  <section class="reveal">
    <h2>How we work</h2>
    <div class="how">
      <div><h3>Your clips become support</h3><p>Most rods FISCHXR handles were added the same way: someone sent us a recording of the reel, and we taught FISCHXR how it works.</p></div>
      <div><h3>Tested before it ships</h3><p>Every release runs through over two hundred automated checks, and our testers fish with it before you do.</p></div>
      <div><h3>Updates come to you</h3><p>When there's a new version, FISCHXR updates itself in one click. No hunting for downloads.</p></div>
    </div>
  </section>

  <section class="reveal">
    <div class="maker">
      <p><b>Want to help?</b> Testers and content creators are always welcome. Say hello in the Discord.</p>
      <a class="btn ghost" href=\"""" + DISCORD + """\">Join the Discord</a>
    </div>
  </section>
</div>
""" + FOOT

open("about.html", "w", encoding="utf-8").write(about_page())
print("about page written")

def leaderboard_page():
    return head("Leaderboard | FISCHXR by ReelWorks", "Who's reeled in the most with FISCHXR, this week and all time.", "leaderboard") + """
<div class="wrap">
  <div class="top">
    <h1>Leaderboard</h1>
    <p class="lede">Reels with FISCHXR since the leaderboards began, and the rarest fish caught with it. Weeks start on Monday (UTC).</p>
  </div>
  <div class="tabs" role="tablist" aria-label="Period">
    <button type="button" role="tab" aria-selected="true" data-period="week">This week</button>
    <button type="button" role="tab" aria-selected="false" data-period="all">All time</button>
    <button type="button" role="tab" aria-selected="false" data-period="rare-week">Rarest this week</button>
    <button type="button" role="tab" aria-selected="false" data-period="rare-all">Rarest all time</button>
  </div>
  <ol class="board" id="board" data-period="week" data-limit="25"><li class="empty">Loading&hellip;</li></ol>
  <p class="boardnote">Sign in with Discord in FISCHXR and your reels count. Rather not be listed? Switch it off on <a href="profile.html">your profile</a>, or use <kbd>/leaderboard-visibility</kbd> in Discord.</p>
</div>
""" + FOOT

def profile_page():
    return head("Your profile | FISCHXR by ReelWorks", "Your FISCHXR profile: your macro, your Plus, your reels and your rank.", "profile") + """
<div class="wrap">
  <div id="profile-out" class="pf-out">
    <div class="top">
      <h1>Your profile</h1>
      <p class="lede">Sign in with Discord to see your macro, your Plus, your reels and where you rank.</p>
      <div class="get"><button type="button" class="btn big discordbtn" id="pf-signin">Sign in with Discord</button>
        <p class="fine" id="pf-msg">We only ask Discord who you are and your roles in the FISCHXR server.</p></div>
    </div>
  </div>
  <div id="profile-in" class="pf-in pf-themed" hidden>
    <div class="pf-card" data-pf="card">
      <div class="pf-banner" id="pf-banner" data-pf="banner"><div class="bn-blur"></div><div class="bn-img"></div></div>
      <div class="pf-head">
        <img class="pf-avatar" id="pf-avatar" alt="">
        <div class="pf-names"><h1 id="pf-name" data-pf="name"></h1><p id="pf-user"></p></div>
        <div class="pf-badges" id="pf-badges"></div>
      </div>
      <p class="pf-bio" data-pf="bio" hidden></p>
      <div class="pf-featured" data-pf="featured" hidden></div>
      <div class="pf-roles" id="pf-roles"></div>
      <p class="pf-warn" id="pf-warn" hidden></p>
    </div>
    <div class="pf-widgets" data-pf="widgets">
      <div class="pf-box" data-w="status"><h3>Your macro</h3><dl id="pf-macro"></dl></div>
      <div class="pf-box" data-w="reels"><h3>Your reels</h3>
        <div class="pf-nums">
          <div><b id="pf-week">&ndash;</b><span id="pf-week-rank">this week</span></div>
          <div><b id="pf-all">&ndash;</b><span id="pf-all-rank">all time</span></div>
          <div><b id="pf-hours">&ndash;</b><span>hours fished</span></div>
        </div>
      </div>
      <div class="pf-box pf-best" data-w="best"><h3>Best catches</h3><ol class="best" id="pf-best"></ol><p class="pf-alerts" id="pf-alerts"></p></div>
      <div class="pf-box pf-ms" data-w="milestones"><h3>Milestones</h3><div class="ms-badges" id="pf-ms"></div></div>
    </div>
    <div class="pf-box pf-settings">
      <label class="switch"><input type="checkbox" id="pf-show"><span class="track"></span> Public profile: show me in search and on the leaderboards</label>
      <a class="btn ghost" id="pf-public" href="players.html">View your public profile</a>
      <button type="button" class="btn ghost" id="pf-signout">Sign out</button>
    </div>
    <div class="pf-box pf-edit" id="pf-edit"></div>
  </div>
</div>
""" + FOOT

open("leaderboard.html", "w", encoding="utf-8").write(leaderboard_page())
open("profile.html", "w", encoding="utf-8").write(profile_page())
print("leaderboard and profile written")

def players_page():
    return head("Players | FISCHXR by ReelWorks", "Find FISCHXR players and see their profiles.", "players") + """
<div class="wrap">
  <div class="top">
    <h1>Players</h1>
    <p class="lede">Find anyone using FISCHXR by their Discord name, username or ID.</p>
    <label class="psearch">
      <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-3.6-3.6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      <input type="search" id="psearch" placeholder="Search players" autocomplete="off" aria-label="Search players" maxlength="40">
      <kbd class="pkey" aria-hidden="true">/</kbd>
    </label>
  </div>
  <div class="phead"><h2 class="ptitle" id="ptitle">Top players</h2><span class="pcount" id="pcount"></span></div>
  <div class="pcards" id="presults"><p class="pempty">Loading&hellip;</p></div>
</div>
""" + FOOT

def public_profile_page():
    return head("Profile | FISCHXR by ReelWorks", "A FISCHXR player's profile.", "players") + """
<div class="wrap">
  <div class="top pu-msg" id="pu-msg"><h1>Loading&hellip;</h1></div>
  <div id="pu" class="pf-in pf-themed" hidden>
    <div class="pf-card" data-pf="card">
      <div class="pf-banner" data-pf="banner"><div class="bn-blur"></div><div class="bn-img"></div></div>
      <div class="pf-head">
        <img class="pf-avatar" id="pu-avatar" alt="">
        <div class="pf-names"><h1 data-pf="name" id="pu-name"></h1><p id="pu-status"></p></div>
        <div class="pf-badges" id="pu-badges"></div>
      </div>
      <p class="pf-bio" data-pf="bio" hidden></p>
      <div class="pf-featured" data-pf="featured" hidden></div>
      <div class="pf-roles" id="pu-roles"></div>
    </div>
    <div class="pf-widgets" data-pf="widgets">
      <div class="pf-box" data-w="status"><h3>Status</h3><p class="pu-fishing" id="pu-fishing"></p></div>
      <div class="pf-box" data-w="reels"><h3>Reels</h3>
        <div class="pf-nums">
          <div><b id="pu-week">&ndash;</b><span id="pu-week-rank">this week</span></div>
          <div><b id="pu-all">&ndash;</b><span id="pu-all-rank">since launch</span></div>
          <div><b id="pu-hours">&ndash;</b><span>hours fished</span></div>
        </div>
      </div>
      <div class="pf-box pf-best" data-w="best"><h3>Best catches</h3><ol class="best" id="pu-best"></ol></div>
      <div class="pf-box pf-ms" data-w="milestones"><h3>Milestones</h3><div class="ms-badges" id="pu-ms"></div></div>
    </div>
  </div>
</div>
""" + FOOT

open("players.html", "w", encoding="utf-8").write(players_page())
open("u.html", "w", encoding="utf-8").write(public_profile_page())
print("players and public profile written")

FUNCTION = r'''// Generated by gen_site.py: blocks /download/ while downloads are switched off
// (with /downloads in the bot). Asks the FISCHXR service at most every 30 seconds.
const SERVICE = %s;
let cache = { at: 0, value: null };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export async function onRequest(context) {
  try {
    if (!cache.value || Date.now() - cache.at > 30000) {
      const r = await fetch(SERVICE + "/site", { cf: { cacheTtl: 0 } });
      cache = { at: Date.now(), value: r.ok ? await r.json() : null };
    }
    const d = cache.value && cache.value.downloads;
    if (d && d.enabled === false) {
      const msg = esc(d.message || "FISCHXR downloads are switched off for now. Check the Discord for news.");
      return new Response('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Downloads paused</title>'
        + '<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#000;color:#fff;font:16px/1.6 system-ui,sans-serif;text-align:center;padding:24px">'
        + '<div><h1 style="font-size:32px;margin:0 0 10px">Downloads are paused</h1><p style="color:#9A9A9A;max-width:46ch;margin:0 auto">' + msg + '</p></div></body>',
        { status: 503, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    }
  } catch (e) { /* the service can't be reached: don't block downloads */ }
  return context.next();
}
''' % json.dumps(SERVICE.rstrip("/"))
os.makedirs("functions/download", exist_ok=True)
open("functions/download/_middleware.js", "w", encoding="utf-8").write(FUNCTION)
print("download guard written")
