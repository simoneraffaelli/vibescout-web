# Become a Scout

VibeScout is powered by real people — **Scouts** — who place devices out in the world to listen and identify the music playing around them. If you'd like to join the network and start spotting tracks, this guide will walk you through everything you need to know.

---

## How It Works

A Scout is someone who runs a small device that listens to ambient music, identifies the song, and sends it to the VibeScout feed in real time. Your device could be sitting on a windowsill in a busy neighborhood, mounted on a balcony overlooking a street market, or tucked inside a weatherproof box on a rooftop — anywhere music is playing.

Every track your device picks up appears on the live feed at [vibescout.com](https://vibescout.com), helping people around the world discover new music as it happens.

---

## Step 1: Register as a Scout

To start spotting tracks, you need a **Device ID** — a unique key that authorizes your device to send tracks to VibeScout.

**To get one, simply send an email to:**

> **devs@simone.ooo**

In your email, include:

- **Your name** (or a nickname — whatever you're comfortable with)
- **Where you plan to place your device** (city, neighborhood, or a general description like "café district in Lisbon")
- **A short sentence about why you want to be a Scout** (we love hearing what motivates people!)

We'll reply with your Device ID and instructions on how to set it up. It usually takes a day or two.

---

## Step 2: Get Your Device Ready

To run the VibeScout spotter app, you'll need a small computing device. Here's what works:

### Recommended Devices

| Device | Price Range | Notes |
|---|---|---|
| **Raspberry Pi 4 or 5** | ~€40–€80 | The most popular choice. Small, affordable, and reliable. |
| **Raspberry Pi Zero 2 W** | ~€18 | Even smaller and cheaper, great for compact setups. |
| **Any old Android phone** | Free (if you have one lying around) | Works well and already has a microphone built in. |

### What Your Device Needs

- **A microphone** — to listen to the music around it. Most Android phones have one built in. For a Raspberry Pi, you'll need a small USB microphone (around €5–€10).
- **An internet connection** — Wi-Fi is the easiest option. The app sends very small amounts of data, so even a slow connection works fine.
- **Power** — a simple USB power supply, a power bank, or a solar panel setup (more on that below).

### Software Requirements

- The VibeScout spotter app (we'll send you the download link when you register)
- For Raspberry Pi: Raspberry Pi OS (the default operating system that comes with it)
- For Android: Android 8.0 or newer

Don't worry if this sounds technical — the setup guide we send with your Device ID walks you through every step with pictures.

---

## Step 3 (Optional): Build a Scout Box

Want your device to spot tracks **24 hours a day, 7 days a week**, without needing a power outlet nearby? You can build a **Scout Box** — a small, weatherproof, solar-powered enclosure that keeps your device running outdoors, rain or shine.

This is inspired by [Riley Waltz's Bop Spotter](https://walzr.com/bop-spotter), a solar-powered music listener mounted in San Francisco's Mission District.

### What You'll Need

| Part | What It Does | Approximate Cost |
|---|---|---|
| **A small solar panel (10W–20W)** | Captures sunlight and turns it into electricity | €15–€30 |
| **A solar charge controller** | Protects the battery from overcharging | €8–€15 |
| **A 12V rechargeable battery (7Ah–12Ah)** | Stores energy for nighttime and cloudy days | €15–€25 |
| **A USB step-down converter (12V to 5V)** | Converts the battery's power to USB voltage for your device | €3–€5 |
| **A weatherproof enclosure (IP65 box)** | Keeps everything dry and protected from the elements | €10–€20 |
| **A small USB microphone** | Listens to the music (mount it so it pokes outside the box) | €5–€10 |
| **Your Raspberry Pi or Android phone** | The brain of the operation | (see above) |
| **Cables, zip ties, and mounting hardware** | Holds everything together | €5–€10 |

**Total cost: roughly €60–€120**, depending on what you already have.

### How to Put It Together

1. **Mount the solar panel** on the outside of your box lid (or on a separate bracket nearby). Angle it toward the sun — roughly 30–45 degrees works well in most places.

2. **Connect the solar panel to the charge controller**, and the charge controller to the battery. The charge controller sits between the two and makes sure the battery charges safely. Most controllers have clear labels showing where each wire goes (Solar → Battery).

3. **Plug the USB converter into the battery**. This gives you a standard USB port that outputs the right amount of power for your device.

4. **Place your Raspberry Pi (or phone) inside the box** and plug it into the USB converter. Make sure air can circulate a little — you can drill a couple of small ventilation holes on the side (pointed downward so rain doesn't get in).

5. **Mount the microphone** so it can hear the outside world. A small hole in the side of the box with the microphone tip poking through works great. Seal around it with a bit of silicone to keep water out.

6. **Close the box, mount it somewhere interesting**, and let it do its thing.

### Placement Tips

- **Height matters** — placing the box a few meters up (on a wall, pole, or rooftop edge) helps it hear more music and avoids accidental damage.
- **Pick a lively spot** — near cafés, markets, parks, busy streets, or anywhere people play music.
- **Check the sun** — make sure the solar panel isn't shaded for most of the day. Even partial shade significantly reduces charging.
- **Test before you mount** — run the whole setup for a day or two on a table before committing to a permanent spot. Make sure it charges well and spots tracks reliably.

---

## Questions?

If you run into any trouble or just want to say hi, reach out anytime:

> **devs@simone.ooo**

Welcome to the Scout network. 🎵
