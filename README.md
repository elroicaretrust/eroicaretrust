# ELROI CARE TRUST - Production Website & Management Portal
**Official Website:** [www.elroicaretrust.in](https://www.elroicaretrust.in)  
**Tagline:** *Care, Compassion and Humanity*  
**Founder & Managing Trustee:** P.K. Immanuel Neas Kumar  
**Official Mobile / WhatsApp:** +91 7904947631  
**Registered Office:** No. 1, Venkatapuram Road 4, Katchur Medu, Uthukottai Taluk, Tiruvallur District, Tamil Nadu – 602026, India.

---

## 🌟 Executive Overview
This is a modern, responsive, professional web application and management system developed specifically for **ELROI CARE TRUST**. The system features an elegant **Royal Blue, Pure White, and Gold** design aesthetic and is built with **zero external npm dependencies** required to run out of the box.

### Key Capabilities:
1. **Homepage:** Impact statistics, inspirational hero slider, founder quotes, 80G tax exemption badges, and quick donation channels.
2. **About Us:** Complete trust history, vision, mission, and the profile of Founder **P.K. Immanuel Neas Kumar**.
3. **80G & 12A Registration:** Full legal transparency, 50% tax deduction eligibility, Form 10BD/10BE guidance, and an interactive **80G Tax Savings Calculator**.
4. **Donation Services:**
   - **Karur Vysya Bank Ltd. (KVB)** verified details with one-click copy buttons (Account: `1743115000001034`, IFSC: `KVBL0001743`).
   - Dynamic **UPI QR Code** generator (PhonePe, GPay, Paytm, BHIM) that updates live with preset amounts (₹500, ₹1,500, ₹3,000, ₹5,000, Custom).
   - Mobile one-tap UPI app direct checkout.
   - **FCRA International Donation Advisory** for NRIs and overseas supporters.
5. **Instant 80G Tax Receipt Generator:**
   - Online submission form where donors provide PAN, Amount, Date, and Bank UTR.
   - Generates an official, serial-numbered, printable 80G Tax Donation Receipt (`/receipt.html?id=...`) with trust seal and founder signature.
6. **Photo Gallery:**
   - Pre-loaded with **96 authentic charity field photographs** from the `kenny/` folder.
   - Interactive category filtering (Monthly Provisions, Blind & Differently Abled, Children Welfare, Widows & Seniors, Tribal Outreach).
   - High-resolution modal lightbox viewer with keyboard arrow navigation.
7. **Our Activities:** In-depth project portfolios for Monthly Ration Kits, Blind Assistance, Widow Care, Children Camps, and Tribal Nomadic Hamlets.
8. **Contact Us:** Interactive inquiry and volunteer form, Google Maps embed for Uthukottai/Tiruvallur, direct click-to-call and WhatsApp links.
9. **Admin Dashboard (`/admin.html`):**
   - Password-protected management portal.
   - Photo uploader to add new activity photos directly from mobile or desktop.
   - Live donation records viewer with 80G receipt reprint access.
   - Enquiries and messages inbox.

---

## 🚀 How to Run Locally

You can launch the web application immediately on your computer:

```bash
# 1. Open terminal in the project directory:
cd C:\project1\trust

# 2. Start the server (No npm install required! Pure Node.js):
node server.js
```

Then open your browser and navigate to:
- **Public Website:** `http://localhost:3000/`
- **Admin Portal:** `http://localhost:3000/admin.html`
  - **Username:** `admin`
  - **Password:** `elroitrust@2026`

---

## 📸 How to Upload Photos on the Website (Local & Vercel Cloud)

You have three convenient ways to add photos:

### Method 1: Directly from the Photo Gallery Page (Easiest!)
1. Open the Photo Gallery page: `http://localhost:3000/gallery.html` (or `https://www.elroicaretrust.in/gallery.html`).
2. Click the gold **"📸 Upload New Photo"** button at the top of the gallery.
3. Select an image from your smartphone camera, photo gallery, or computer.
4. Enter the Activity Title, select the Category (e.g. *Monthly Provisions*, *Blind & Differently Abled*, *Children*, *Widows*, *Tribal*), and date.
5. Enter the trust admin passcode (`elroitrust@2026`).
6. Click **"Upload & Publish to Gallery"**. The photo immediately appears at the top of the gallery with zero page reload needed!

### Method 2: From the Admin Management Portal
1. Open `http://localhost:3000/admin.html` &gt; Log in with `admin` / `elroitrust@2026`.
2. Click on the **"Upload New Photos"** tab.
3. Choose the image, fill in details, and click **"Upload & Publish to Gallery"**.

### Method 3: Direct Folder Drop
- Simply copy your new `.jpeg` or `.jpg` photo into the `kenny/` folder. The server dynamically scans the folder and includes it in the gallery automatically!

---

## ☁️ Storing Photos in Vercel Cloud (Vercel Blob Storage)

When you deploy your website to **Vercel**, serverless filesystems are read-only. The website is pre-configured to store all uploaded photos in **Vercel Blob Storage** (Vercel's global high-speed CDN):

1. **Deploy to Vercel:**
   - Push your code to GitHub.
   - On [vercel.com](https://vercel.com), click **Add New Project** &gt; Import your repository.
   - Vercel automatically detects the included `vercel.json` file.
2. **Create Blob Storage in Vercel:**
   - In your Vercel Project dashboard, go to the **Storage** tab.
   - Click **Create Database** &gt; Select **Blob** &gt; Click **Continue & Connect**.
   - Vercel automatically injects the `BLOB_READ_WRITE_TOKEN` environment variable!
3. **Automatic Cloud Storage:**
   - Once connected, any photo uploaded via the website or admin dashboard is stored directly on Vercel's global CDN (`https://...public.blob.vercel-storage.com/...`).
   - Photos remain permanently stored in the cloud, load at lightning speed worldwide, and are never lost!
4. **Manage Storage in Admin Portal:**
   - Visit `/admin.html` &gt; Click **"Vercel Cloud & Storage"** tab.
   - You can see your live storage status, test connection to Vercel Blob with 1 click, and update tokens if needed.

---

## 🌐 How to Host the Website Online for FREE on Vercel

### Deploying on Vercel (Recommended):
1. Create a free account at [vercel.com](https://vercel.com).
2. Connect your GitHub account and import this repository.
3. Click **Deploy**. In under 60 seconds, your site is live with global CDN!
4. Connect your GoDaddy domain (`www.elroicaretrust.in`) in **Project Settings > Domains**. Vercel will issue a free automatic SSL/HTTPS certificate!

---

## 🔗 How to Connect Your GoDaddy Domain (`www.elroicaretrust.in`)

Once your website is deployed on your hosting provider (such as Render or a VPS):

1. **Log in to GoDaddy:**
   - Go to [godaddy.com](https://www.godaddy.com) and log into your account.
   - Go to **My Products** &gt; Find **elroicaretrust.in** &gt; Click **DNS**.

2. **Add / Edit DNS Records:**
   - **A Record (Points apex domain `elroicaretrust.in`):**
     - Type: `A`
     - Name: `@`
     - Value: `[Your Server / Host IP Address]` (e.g. Render's IP `216.24.57.1` or your server IP)
     - TTL: `1/2 Hour` (or Default)
   - **CNAME Record (Points `www.elroicaretrust.in`):**
     - Type: `CNAME`
     - Name: `www`
     - Value: `[Your Host URL, e.g. elroi-care-trust.onrender.com]`
     - TTL: `1/2 Hour`

3. **In Your Host (Render / Vercel):**
   - Go to **Settings** &gt; **Custom Domains**.
   - Add `elroicaretrust.in` and `www.elroicaretrust.in`.
   - The host will automatically provision a **free SSL Certificate (HTTPS)** within 15 to 30 minutes!

---

## 🔍 Google Search Console & Domain Verification

To get `www.elroicaretrust.in` indexed on Google Search:

1. Open [Google Search Console](https://search.google.com/search-console).
2. Click **Add Property** &gt; Choose **Domain** &gt; Enter `elroicaretrust.in`.
3. Google will show you a **TXT Record** (e.g. `google-site-verification=XXXXXXXXXXXXXXXX`).
4. In your **GoDaddy DNS Management**:
   - Click **Add New Record**.
   - Type: `TXT`
   - Name: `@`
   - Value: `google-site-verification=XXXXXXXXXXXXXXXX`
   - TTL: `1/2 Hour`
   - Click **Save**.
5. Return to Google Search Console and click **Verify**.
6. Google will verify domain ownership and start indexing your pages on Google Search results!

---

## ✉️ Free Official Email Setup (`contact@elroicaretrust.in`)

To send and receive emails as `contact@elroicaretrust.in` for free:

1. Sign up for **Zoho Mail's Forever Free Plan** (allows up to 5 business mailboxes for free).
2. Choose **"Sign up with a domain I already own"** &gt; Enter `elroicaretrust.in`.
3. In GoDaddy DNS, add the 3 Zoho MX Records provided by Zoho:
   - Priority 10: `mx.zoho.in` (or `mx.zoho.com`)
   - Priority 20: `mx2.zoho.in`
   - Priority 50: `mx3.zoho.in`
   - Add SPF TXT record: `v=spf1 include:zoho.in ~all`
4. You now have a working, official, free inbox at `contact@elroicaretrust.in`!

---

## 🏛️ Verified Trust Information Summary
| Attribute | Official Record |
|---|---|
| **Trust Name** | ELROI CARE TRUST (MESSRS. EL-ROI TRUST) |
| **Registration Number** | IV-12/2022 |
| **Tax Exemption** | Section 80G (50% Deduction) & Section 12A |
| **Founder & Managing Trustee** | P.K. Immanuel Neas Kumar |
| **Contact Phone / WhatsApp** | +91 7904947631 |
| **Email** | contact@elroicaretrust.in / elroicaretrust@gmail.com |
| **Bank Name** | The Karur Vysya Bank Ltd. (KVB) |
| **Account Name** | MESSRS. EL-ROI TRUST |
| **Account Number** | 1743115000001034 |
| **IFSC Code** | KVBL0001743 |
| **Branch** | Seethanjeri Branch (Branch Code: 1743) |
| **Account Type** | Current Account (CA - Resident) |
| **UPI ID** | `imman.pk80@okicici` (Immanuel Nesakumar Official) |
| **Office Address** | No. 1, Venkatapuram Road 4, Katchur Medu, Uthukottai Taluk, Tiruvallur – 602026, Tamil Nadu, India |

---
*Created with love and dedication to serve humanity with Care, Compassion, and Dignity.*

