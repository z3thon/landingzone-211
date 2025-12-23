# Landing Zone - Complete Data Model Analysis

## Overview
Landing Zone is a professional marketplace platform with 38 tables managing profiles, projects, skills, certifications, rates, approvals, and more.

## Complete Table Inventory (38 Tables)

### Core Entity Tables

#### 1. Profiles (bqrmi35s7) - CENTRAL ENTITY
**Purpose:** User profiles - the core entity linking everything
**Key Fields:**
- Name, Address (Street 1/2, City, State/Region, Postal Code, Country)
- Application/Email/User Account fields
- Availability (Available checkbox, Available From/To times)
- Currency fields (Currency, Currency Symbol)
- Company fields (Current Company, Company)
- Privacy settings (multiple privacy setting references)
- Rate references (Coaching Rate, Default Rate)
- Links to: Certifications, Industries, Skills, Rates, Projects, Project Approvals, Endorsements, Approval Team Members, Reviews, Sessions, Employment
- Drip/Drop system fields (for Quickbase workflow)

#### 2. Projects (bqrmzhdwv)
**Purpose:** Projects that professionals can join
**Key Fields:**
- Project name, Company (Related Company, Company name)
- Organizer (Related Organizer, Organizer name)
- Dates (Start Date, End Date)
- Status
- Private checkbox
- Links to: Profiles (dblink), Project Outlines, Project Approvals, Project Files/URLs, Project Needed Roles, Project Needed Skills
- Drip/Drop fields

#### 3. Companies (bqrmqrdty)
**Purpose:** Company information
**Key Fields:**
- Company Name
- Company Email, Website, Phone
- Company Logo (file upload)
- Company Admin references
- Links to: Profiles, Projects, Employment records

### Profile Attributes & Skills

#### 4. Skills (bqrmkveic)
**Purpose:** Skills associated with profiles
**Key Fields:**
- Related Profile
- Related Skill (to Skill Types)
- Skill name, Description
- Language fields (Language checkbox, Language Native Name, Language Abbrv.)
- Endorsement count and links
- Drip/Drop fields

#### 5. Certifications (bqrmteawh)
**Purpose:** Certifications held by profiles
**Key Fields:**
- Related Profile
- Certification Title
- Related Certification Type
- URL/Link or File attachment
- Effective Date, End Date
- Status
- Drip/Drop fields

#### 6. Rates (bqrmkxday)
**Purpose:** Hourly rates for profiles
**Key Fields:**
- Related Profile
- Rate per hr (numeric)
- Start Date, End Date
- Previous Rate tracking
- Related Currency
- Related Rate Type
- Default Rate checkbox
- Coaching Rate references
- Status (rich-text)
- Rate Memo
- Links to Project Approvals
- Drip/Drop fields

#### 7. Industries (bqrmi2jsx)
**Purpose:** Industries associated with profiles
**Key Fields:**
- Related Profile
- Related Industry Type
- Industry name
- Abbreviation
- Date ranges (From/To dates)
- Drip/Drop fields

#### 8. Employment (btdg4hfis)
**Purpose:** Employment history
**Key Fields:**
- Related Profile
- Related Company
- Start Date, End Date
- Status
- Company Admin checkbox
- Company Verified checkbox
- Drip/Drop fields

### Project Management

#### 9. Project Outlines (bqsxar6cs)
**Purpose:** Detailed outlines for projects
**Key Fields:**
- Related Project
- Outline (rich-text)
- Title
- Order #
- Publish checkbox and Publish Date/Time
- Drip/Drop fields

#### 10. Project Approvals (bqrm2m3c4)
**Purpose:** Approval workflow linking profiles to projects
**Key Fields:**
- Related Profile, Related Project
- Approved checkbox (by Organizer)
- Organizer Approved status
- Invitation/Application type
- Role (Related Project Needed Role)
- Rate (Related Rate, Rate per hr)
- Skills, Languages, Industries (multitext)
- Memo, Notes
- Links to Reviews
- Drip/Drop fields

#### 11. Project Files/URLs (bs6bzisqf)
**Purpose:** Files and URLs attached to projects
**Key Fields:**
- Related Project
- Attachment (file) or URL/Link
- Attachment/URL choice field
- Memo
- Resource (rich-text)

#### 12. Project Needed Roles (bs6b3i96q)
**Purpose:** Roles needed for projects
**Key Fields:**
- Related Project
- Related Role Type
- Role name
- Associated Skills (multitext)
- Links to Project Approvals

#### 13. Project Needed Skills (bs6cd55ff)
**Purpose:** Skills needed for projects
**Key Fields:**
- Related Project
- Related Skill Type
- Skill name, Description
- Language fields (Language checkbox, Language Abbrv., Native Name)
- Skill Ref

### Social & Reviews

#### 14. Endorsements (bs6aqhbb3)
**Purpose:** Peer endorsements for skills
**Key Fields:**
- Related Endorsee (profile receiving endorsement)
- Related Endorser (profile giving endorsement)
- Related Skill
- Date

#### 15. Reviews (bs6ap3uyp)
**Purpose:** Public reviews
**Key Fields:**
- Related Profile
- Related Project Approval
- Review (Public) - rich-text
- Profile and Project Approval references

#### 16. Feedback (bs6aqe9r5)
**Purpose:** Private anonymous feedback
**Key Fields:**
- Feedback (Private & Anonymous) - rich-text

#### 17. Skill Reviews (bs6aqr3jz)
**Purpose:** Reviews specific to skills (minimal fields - just metadata)

### Approval System

#### 18. Approval Teams (bs6akvzjh)
**Purpose:** Teams that can approve things
**Key Fields:**
- Team Name
- Team Creation Date, Team Retirement Date
- Status
- Links to Approval Team Members

#### 19. Approval Team Members (bs6akyyes)
**Purpose:** Members of approval teams
**Key Fields:**
- Related Profile
- Related Approval Team
- Start Date, End Date
- Status

#### 20. Approvals/Verifications (bs6amiwmn)
**Purpose:** Approval records for teams
**Key Fields:**
- Approved checkbox
- Approved By (user)
- Date Approved
- Comment
- Approval/Verification Type

### Lookup/Reference Tables

#### 21. Role Types (bs6arxjab)
**Purpose:** Types of roles
**Key Fields:**
- Role name
- Associated Skills (multitext)
- Links to: Role Type Skills, Project Needed Roles

#### 22. Skill Types (bs52eram5)
**Purpose:** Master list of skill types
**Key Fields:**
- Skill name
- Description
- Language checkbox
- Language Abbrv., Native Name
- Links to: Skill type records, Role Type Skills, Project Needed Skills

#### 23. Industries Types (bs52e5iw7)
**Purpose:** Master list of industry types
**Key Fields:**
- Industry Type name
- Abbreviation

#### 24. Certification Types (bs6amtvj4)
**Purpose:** Master list of certification types
**Key Fields:**
- Certification Type name
- Links to Certifications

#### 25. Role Type Skills (bs6arza5f)
**Purpose:** Junction table linking Role Types to Skill Types
**Key Fields:**
- Related Role Type
- Related Skill Type
- Language checkbox
- Skill Description

#### 26. Rate Types (bs6iuttth)
**Purpose:** Types of rates (e.g., hourly, coaching, etc.)
**Key Fields:**
- Rate Type name
- Description
- Links to Rates

### Supporting/System Tables

#### 27. Currency (bs5z3vdw5)
**Purpose:** Currency reference data
**Key Fields:**
- Currency name
- Abbreviation
- Symbol
- Links to Rates, Profiles

#### 28. Countries (bs6bnayvw)
**Purpose:** Country reference data
**Key Fields:**
- Country name
- Links to Profiles

#### 29. Time Zones + DST (bs5zydrvw)
**Purpose:** Timezone data with DST calculations
**Key Fields:**
- Time Zone name
- UTC Offset, UTC Offset + DST
- DST dates (Start/End for current/last/next year)
- DST times
- Current time calculations
- Links to Profiles

#### 30. Privacy Settings (bs6bnh94m)
**Purpose:** Privacy setting options
**Key Fields:**
- Privacy Setting name
- Description
- Order
- Multiple links to Profiles (for different privacy types)

#### 31. Landing Zone User Use Cases (bs6axwh7c)
**Purpose:** Use case categories
**Key Fields:**
- Use Case name
- Description
- Links to Applications, Profiles

#### 32. Registration (bqswrwat6)
**Purpose:** Registration form data
**Key Fields:**
- Name, Email, First Name, Last Name
- Use Case
- Privacy Policy agreement
- Mission/Culture/Values agreement
- Links to Profiles

### Advanced Features

#### 33. Sessions (bs6it33sj)
**Purpose:** Voice/session tracking
**Key Fields:**
- Related Profile
- Related Voice Channel
- Enter timestamp, Exit timestamp

#### 34. Voice Channels (bs6itwp2q)
**Purpose:** Voice channel definitions
**Key Fields:**
- Voice Channel name
- VC ID
- Links to Sessions

#### 35. Retainers (bs6iyzuw9)
**Purpose:** Retainer agreements
**Key Fields:**
- Retainer Name
- Memo

#### 36. Transactions (bs6iy38uw)
**Purpose:** Financial transactions
**Key Fields:**
- Date/Time
- Transaction Type (multiple choice)
- Amount (currency)
- Memo

### Quickbase-Specific Workflow Tables

#### 37. Drip (bs6i2jk9p)
**Purpose:** Quickbase workflow system
**Key Fields:**
- Drip (multitext)
- Links to Profiles

#### 38. Drop (bs6ku3gmu)
**Purpose:** Quickbase workflow system
**Key Fields:**
- Email
- Links to Profiles

## Key Relationships

### Profile-Centric Relationships
- Profiles → Skills (one-to-many)
- Profiles → Certifications (one-to-many)
- Profiles → Rates (one-to-many)
- Profiles → Industries (one-to-many)
- Profiles → Employment (one-to-many)
- Profiles → Projects (many-to-many via Project Approvals)
- Profiles → Endorsements (as endorsee and endorser)
- Profiles → Reviews (as reviewer and reviewee)
- Profiles → Approval Team Members (one-to-many)

### Project-Centric Relationships
- Projects → Project Outlines (one-to-many)
- Projects → Project Approvals (one-to-many)
- Projects → Project Files/URLs (one-to-many)
- Projects → Project Needed Roles (one-to-many)
- Projects → Project Needed Skills (one-to-many)
- Projects → Profiles (many-to-many via Project Approvals)

### Lookup Relationships
- Skill Types → Skills (one-to-many)
- Skill Types → Role Type Skills (one-to-many)
- Skill Types → Project Needed Skills (one-to-many)
- Role Types → Role Type Skills (one-to-many)
- Role Types → Project Needed Roles (one-to-many)
- Certification Types → Certifications (one-to-many)
- Industries Types → Industries (one-to-many)
- Rate Types → Rates (one-to-many)
- Currency → Rates (one-to-many)

### Approval System Relationships
- Approval Teams → Approval Team Members (one-to-many)
- Approval Team Members → Profiles (many-to-one)
- Approvals/Verifications → (standalone approval records)

## Data Model Patterns

### Drip-Drop System
Many tables have "Drip" (multitext) and "Drop" (text/user) fields - these were Quickbase's permission/access control system for passing permissions throughout the platform. **Will be replaced by Supabase Row Level Security (RLS) policies** - no migration needed.

### Privacy System
Profiles have multiple privacy setting references (Email Privacy, Phone Privacy, Intro Privacy, Portfolio/Resume Privacy, Rate Privacy) - these can be consolidated into a single privacy settings structure.

### Rate System
Rates have:
- Default Rate and Coaching Rate tracking
- Rate Type classification
- Currency association
- Historical rate tracking (Previous Rate)
- Links to Project Approvals

### Approval Workflow
Complex approval system with:
- Simple organizer approval (checkbox in Project Approvals)
- Team-based approvals (Approval Teams → Approval Team Members → Approvals/Verifications)
- Multiple approval types

## Simplification Opportunities

1. **Drip/Drop fields** - Quickbase permission system, replaced by Supabase RLS policies (no migration needed)
2. **Multiple Privacy Settings** - Consolidate into single privacy settings structure
3. **Time Zones + DST** - Use standard libraries instead of custom table
4. **Currency/Countries** - Use standard reference data
5. **Registration** - Handle via Supabase Auth
6. **Landing Zone User Use Cases** - May not be needed
7. **Feedback vs Reviews** - Could merge or simplify
8. **Approval Teams** - Could simplify to role-based permissions
9. **Skill Reviews** - Minimal data, evaluate if needed
10. **Retainers/Transactions** - Evaluate if these are actively used

