# Database Implementation Summary

## ✅ Completed Tasks

### 1. Prisma Schema Update ([schema.prisma](prisma/schema.prisma))

**Added 7 Enums:**
- `AuthProvider` - google, apple, email
- `Visibility` - public, connections, private
- `ConnectionStatus` - pending, accepted
- `ConversationType` - dm, group
- `ParticipantRole` - owner, admin, member
- `MessageType` - text, image, journey, system
- `InviteStatus` - pending, accepted, declined

**Created 10 New Tables:**
1. `user_identities` - Multi-provider authentication support
2. `profiles` - User profile data (migrated from users table)
3. `connections` - Social connections with status
4. `journeys` - Travel plans and trips
5. `user_blocks` - User blocking for safety
6. `conversations` - Chat conversations (DM & group)
7. `conversation_participants` - Conversation membership
8. `conversation_invites` - Group chat invitations
9. `messages` - Message content with soft delete
10. `user_locations` - Geographic location with PostGIS

**Updated `users` Table:**
- Simplified to core authentication fields
- Added relationships to all new tables
- Prepared for profile data migration

---

### 2. SQL Migration Files ([prisma/migrations/](prisma/migrations/))

#### [00_enable_postgis.sql](prisma/migrations/00_enable_postgis.sql)
- Enables PostGIS extension for geography support
- Required for `user_locations` spatial queries

#### [01_add_constraints.sql](prisma/migrations/01_add_constraints.sql)
**Database Constraints:**
- CHECK constraint: `user_a < user_b` in connections table
- Prevents duplicate connections

**Performance Indexes:**
- `idx_user_locations_geo` - GIST spatial index for location queries
- `idx_messages_active` - Partial index for non-deleted messages
- `idx_connections_status` - Index for accepted connections
- `idx_invites_pending_expired` - Index for cleanup jobs

#### [02_triggers.sql](prisma/migrations/02_triggers.sql)
**Database Triggers:**
1. `update_conversation_last_message()` - Auto-updates conversation metadata when new message arrives
2. `handle_message_deletion()` - Handles soft-deleted messages, updates last_message_id
3. `update_location_timestamp()` - Auto-updates timestamp when location changes

#### [03_enable_realtime.sql](prisma/migrations/03_enable_realtime.sql)
**Enabled Realtime for Tables:**
- `messages` - Real-time message delivery
- `user_locations` - Live location updates for Discovery Map
- `connections` - Connection request notifications
- `conversation_participants` - Participant join/leave events
- `conversations` - Conversation metadata changes

#### [04_row_level_security.sql](prisma/migrations/04_row_level_security.sql)
**RLS Policies Created:**

**Messages:**
- Read: Only messages from user's conversations (non-deleted)
- Insert: Only to conversations user is part of
- Update: Only own messages (soft delete)

**User Locations:**
- Read: Based on privacy settings (public/connections/private)
- Update: Only own location

**Connections:**
- Read: Only involving the user
- Insert: User can send requests
- Update: Recipient can accept

**Conversations:**
- Read: Only conversations user is part of
- Insert: User can create
- Update: Only owner can modify

**Profiles:**
- Read: Based on visibility (public/connections/private)
- Update: Only own profile

**Journeys:**
- Read: Based on profile visibility
- Manage: Only own journeys

#### [05_migrate_user_data.sql](prisma/migrations/05_migrate_user_data.sql)
**Data Migration:**
- Migrates existing user data to `profiles` table
- Preserves: full_name, photo_url → avatar_url, archetypes, interests, bio
- Sets default visibility to `public`
- Includes verification step

---

### 3. Helper Scripts & Documentation

#### [scripts/apply-migrations.sh](scripts/apply-migrations.sh)
**Bash script to apply all migrations in order:**
```bash
./scripts/apply-migrations.sh
```

#### [prisma/migrations/README.md](prisma/migrations/README.md)
**Comprehensive migration guide:**
- Step-by-step execution instructions
- Troubleshooting common errors
- Rollback procedures
- Post-migration verification

---

## 🎯 What This Enables

### Core Features Now Supported:

✅ **Social Connections**
- Send/accept friend requests
- Connection status tracking
- User blocking for safety

✅ **Real-time Messaging**
- DM and group chats
- Message delivery with Realtime
- Soft delete support
- Conversation metadata (last message, etc.)

✅ **Discovery Map** (from DiscoveryMap.tsx)
- Real-time location updates
- Privacy-based visibility (public/connections/private)
- Spatial queries for nearby users
- Connection-based filtering

✅ **Journey Sharing**
- Create travel plans
- Share journeys in messages
- Visibility based on profile settings

✅ **Profile Management**
- Separate profile data from auth
- Visibility controls (public/connections/private)
- Multi-provider authentication support

✅ **Security & Privacy**
- Row Level Security on all tables
- User blocking
- Privacy-based access control
- Supabase Auth integration

---

## 📋 Next Steps

### 1. Apply Migrations to Database

**Option A: Using Prisma (Recommended)**
```bash
cd tribr-backend

# Create migration from schema
npx prisma migrate dev --name full_schema_implementation

# This will:
# - Generate migration SQL
# - Apply to database
# - Regenerate Prisma Client
```

**Option B: Using Custom Script**
```bash
cd tribr-backend
./scripts/apply-migrations.sh
```

**Option C: Manual via Supabase Dashboard**
1. Go to Supabase Dashboard → SQL Editor
2. Execute each .sql file in order (00 → 05)

---

### 2. Update Backend Services

**Update Users Service ([src/modules/users/users.service.ts](src/modules/users/users.service.ts)):**
```typescript
// Now profile is a separate relation
const user = await this.prisma.user.findUnique({
  where: { id },
  include: { profile: true }
});
```

**Create New Services:**
- `ConnectionsService` - Manage social connections
- `MessagesService` - Handle messaging
- `ConversationsService` - Manage conversations
- `JourneysService` - Manage travel plans
- `LocationsService` - Handle user locations

---

### 3. Frontend Integration

**Update Mobile App ([tribr-mobile/](../tribr-mobile/)):**

**Install Supabase Realtime:**
```bash
npm install @supabase/supabase-js
```

**Subscribe to Realtime Updates:**
```typescript
// Example: Listen for new messages
const channel = supabase
  .channel('conversation:123')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: 'conversation_id=eq.123'
  }, (payload) => {
    console.log('New message:', payload.new);
  })
  .subscribe();
```

**Update Discovery Map ([src/screens/DiscoveryMap.tsx](../tribr-mobile/src/screens/DiscoveryMap.tsx)):**
```typescript
// Subscribe to location updates
const locationChannel = supabase
  .channel('user_locations')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'user_locations'
  }, (payload) => {
    // Update map markers in real-time
    updateMarkerPosition(payload.new);
  })
  .subscribe();
```

---

### 4. Testing Checklist

**Database Tests:**
- [ ] All tables created successfully
- [ ] PostGIS extension enabled
- [ ] Indexes created (check with `\di` in psql)
- [ ] Triggers working (test message insertion)
- [ ] RLS policies enforced (test with different user contexts)

**Backend Tests:**
- [ ] Prisma Client generates correctly
- [ ] CRUD operations work for all models
- [ ] Relationships load properly (include/select)
- [ ] Cascade deletes work as expected

**Frontend Tests:**
- [ ] Realtime subscriptions connect
- [ ] Messages appear in real-time
- [ ] Location updates reflect on map
- [ ] Connection requests notify immediately

**Security Tests:**
- [ ] Users can't read others' private messages
- [ ] Location privacy settings respected
- [ ] Blocked users can't see blocker's data
- [ ] RLS policies prevent unauthorized access

---

## 🛠 Troubleshooting

### Common Issues

**1. PostGIS Extension Not Available**
```sql
-- Enable manually in Supabase Dashboard
CREATE EXTENSION IF NOT EXISTS postgis;
```

**2. Realtime Not Working**
- Check if tables are in publication: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`
- Verify in Supabase Dashboard: Database → Replication

**3. RLS Blocking Queries**
```sql
-- Test as specific user
SET request.jwt.claims.sub = 'user-uuid-here';
SELECT * FROM messages; -- Should only show user's messages
```

**4. Migration Fails**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or rollback specific migration
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

---

## 📊 Database Schema Diagram

```
users (auth)
  ├── user_identities (1:N) - Multi-provider login
  ├── profiles (1:1) - User profile data
  ├── connections (M:M) - Social network
  ├── journeys (1:N) - Travel plans
  ├── user_blocks (1:N) - Blocked users
  ├── user_locations (1:1) - Current location
  ├── conversation_participants (1:N) - Chat membership
  └── messages (1:N) - Sent messages

conversations
  ├── conversation_participants (1:N)
  ├── messages (1:N)
  └── conversation_invites (1:N)

messages
  ├── conversation (N:1)
  ├── sender (N:1)
  ├── journey (N:1) - Optional journey share
  └── deleter (N:1) - Who deleted it
```

---

## 🔒 Security Highlights

- **All tables have RLS enabled** - Users can't bypass permissions
- **Soft delete for messages** - Compliance & recovery
- **Privacy controls** - Public/connections/private at profile level
- **User blocking** - Safety feature built-in
- **Supabase Auth integration** - JWT-based authentication
- **Cascade deletes** - Data integrity maintained

---

## 📚 References

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## ✨ Summary

**Total Changes:**
- 7 enums defined
- 10 new tables created
- 1 table updated (users)
- 6 SQL migration files
- 15+ RLS policies
- 3 database triggers
- 6 performance indexes
- PostGIS spatial support
- Realtime enabled for 5 tables

The database is now ready to support the full Tribr social travel platform with messaging, connections, location discovery, and journey sharing! 🚀
