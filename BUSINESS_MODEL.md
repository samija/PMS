# PMS Business Model - Revenue Strategy

## Executive Summary

PMS (Property Management System) is a SaaS platform for the Ethiopian rental market, connecting property owners with tenants through digital property management, payment processing, and marketplace listings. Revenue comes from **subscription fees**, **transaction commissions**, **marketplace fees**, and **premium services**.

---

## Revenue Streams

### 1. SaaS Subscription Plans (Primary Revenue)

| Plan | Price (ETB/mo) | Target | Properties | Units | Features |
|------|----------------|--------|------------|-------|----------|
| **Free** | 0 | Solo landlords | 1 | Up to 5 | Basic dashboard, manual payment tracking |
| **Starter** | 499 | Small landlords | 3 | Up to 15 | Online payments, maintenance requests, tenant portal |
| **Professional** | 1,499 | Property managers | 10 | Up to 100 | All Starter + schedules, reports, bulk actions, priority support |
| **Enterprise** | 4,999 | Real estate companies | Unlimited | Unlimited | All Pro + API access, white-label, dedicated support, custom integrations |

**Why this works:** Ethiopian landlords managing 3+ properties spend significant time on manual rent collection and tracking. Even 499 ETB/month is cheaper than a part-time accountant.

### 2. Payment Transaction Fees (High-Volume Revenue)

| Method | Fee | Who Pays | Notes |
|--------|-----|----------|-------|
| **Chapa** | 1.5% of transaction | Tenant (passed through) | PMS earns markup over Chapa's base fee |
| **Telebirr** | 1.0% of transaction | Tenant | Lower fee drives adoption |
| **SantimPay** | 1.5% of transaction | Tenant | Alternative gateway |
| **Bank Transfer** | Flat 25 ETB | Tenant | Manual verification fee |
| **PMS Commission** | 0.5% on top | Built into gateway fee | PMS's margin on each transaction |

**Example:** A building with 50 units at avg. 8,000 ETB/month rent:
- Monthly rent volume: 400,000 ETB
- PMS commission (0.5%): 2,000 ETB/month per building
- Scale to 100 buildings: 200,000 ETB/month recurring

### 3. Listing Marketplace Fees (Growth Revenue)

| Service | Fee | Description |
|---------|-----|-------------|
| **Basic Listing** | Free | Included with any subscription |
| **Featured Listing** | 199 ETB/week | Appears at top of search results |
| **Boosted Listing** | 499 ETB/week | Top placement + highlighted badge + push notification to matching tenants |
| **Application Fee** | 50 ETB | Per tenant application (refundable on acceptance) |
| **Background Check** | 299 ETB | Tenant verification service (employment, previous landlord references) |

**Why this works:** Addis Ababa has massive rental demand. Owners struggle to find quality tenants; tenants struggle to find available units. A centralized marketplace solves both sides.

### 4. Premium Add-On Services

| Service | Price | Description |
|---------|-------|-------------|
| **SMS Reminders** | 99 ETB/mo | Auto SMS rent reminders to tenants (useful where data is limited) |
| **Payment Reports** | 199 ETB/report | Detailed financial reports for tax purposes |
| **Lease Document Generation** | 149 ETB/lease | Auto-generate legal lease agreements |
| **Tenant Screening** | 299 ETB/tenant | Reference checks and employment verification |
| **Maintenance Vendor Network** | 10% commission | Connect owners with vetted plumbers, electricians, etc. |
| **Insurance Referral** | Commission-based | Partner with insurance companies for property/renter insurance |

### 5. Data & Analytics (Future Revenue)

- **Market Reports:** Sell rental market data (avg. rents by subcity, vacancy rates) to real estate developers and investors
- **Advertising:** Allow moving companies, furniture stores, and home services to advertise to new tenants
- **API Access:** Charge third-party apps to integrate with PMS data (real estate portals, fintech apps)

---

## Pricing Strategy

### Phase 1: Market Capture (Months 1-6)
- **Free tier generous** - 1 property, 5 units, no payment fees
- **Starter at 499 ETB** - aggressive pricing to acquire landlords
- **Zero listing fees** - build marketplace supply
- **Goal:** 500 properties, 2,000 units managed

### Phase 2: Monetization (Months 7-12)
- Introduce payment transaction fees (0.5% commission)
- Launch Featured/Boosted listings
- Add SMS reminders and document generation
- **Goal:** 2,000 properties, 10,000 units, 50M ETB monthly payment volume

### Phase 3: Scale (Year 2)
- Launch Enterprise tier
- Expand to Dire Dawa, Hawassa, Bahir Dar
- Maintenance vendor network
- Tenant screening service
- **Goal:** 10,000 properties, break-even

### Phase 4: Platform (Year 3+)
- API marketplace
- Insurance partnerships
- Market data products
- White-label for real estate companies
- **Goal:** Market leader, profitability

---

## Unit Economics

### Per-Customer LTV (Starter Plan, 24-month horizon)

| Metric | Value |
|--------|-------|
| Subscription | 499 × 24 = 11,976 ETB |
| Payment fees (3 properties × 10 units × 8,000 ETB × 0.5% × 24) | 28,800 ETB |
| Featured listings (2/year × 199 × 4 weeks × 2) | 3,184 ETB |
| Add-ons (avg 100 ETB/mo × 24) | 2,400 ETB |
| **Total LTV** | **~46,360 ETB** |

### Customer Acquisition Cost (CAC)

| Channel | Cost per Customer |
|---------|-------------------|
| Referral program (owner invites owner) | ~200 ETB (referral bonus) |
| Facebook/Telegram ads | ~500 ETB |
| Real estate agent partnerships | ~1,000 ETB |
| Building-to-building sales team | ~800 ETB |
| **Blended CAC** | **~500 ETB** |

**LTV:CAC Ratio = 93:1** — extremely healthy for SaaS.

---

## Go-To-Market Strategy

### Target Segments (Priority Order)

1. **Addis Ababa apartment buildings (20-100 units)** — Highest pain point, highest volume
2. **Individual landlords with 3-10 properties** — Tech-savvy, willing to pay
3. **Real estate management companies** — Enterprise tier, large deal sizes
4. **Commercial property owners** — Offices, shops (Phase 3)

### Acquisition Channels

1. **Telegram Community** — Ethiopian landlords are active on Telegram. Create "PMS Landlords Ethiopia" group, share tips, drive signups.
2. **Referral Program** — Owner invites owner → both get 1 month free. Owner invites tenant → both get featured on marketplace.
3. **Building Managers** — On-ground sales: visit apartment complexes, demo the app to building managers.
4. **Real Estate Agents** — Partner with agents who can recommend PMS to their clients.
5. **Social Media** — Facebook, TikTok ads targeting "Ethiopian landlord", "rental in Addis Ababa".

---

## Competitive Advantages

1. **Ethiopian-first:** ETB currency, Chapa/Telebirr integration, Amharic language support
2. **Mobile-first:** Tenants use phones, not laptops — the mobile app is the primary interface
3. **Marketplace + Management:** Competitors do one or the other. PMS does both, creating a flywheel: more listings → more tenants → more owners → more listings
4. **Payment integration:** Automated rent collection removes the #1 pain point for landlords
5. **Low-cost:** 499 ETB/month is accessible to solo landlords earning 50,000+ ETB/month in rent

---

## Key Metrics to Track

| Metric | Target (Year 1) |
|--------|-----------------|
| Properties managed | 2,000 |
| Active tenants | 10,000 |
| Monthly payment volume | 50M ETB |
| Monthly recurring revenue | 1.5M ETB |
| Churn rate | < 5%/month |
| NPS score | > 50 |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Low digital payment adoption | Support bank transfer + cash tracking |
| Landlord resistance to technology | Free tier + on-ground demos + Amharic UI |
| Payment gateway reliability | Multi-gateway support (Chapa + Telebirr + SantimPay) |
| Copycats | Move fast, build network effects through marketplace |
| Regulatory changes | Stay compliant, partner with legal advisors |

---

## Summary

PMS generates revenue through **4 complementary streams**:
1. **Subscriptions** (predictable, recurring)
2. **Payment fees** (scales with rent volume)
3. **Marketplace fees** (scales with listings)
4. **Premium services** (high-margin add-ons)

The key insight: **landlords will pay for convenience** (automated rent collection, tenant management) while **tenants will use the marketplace** (finding available units). This creates a two-sided network effect that compounds over time.
