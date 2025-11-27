# Prisma Database Setup Guide

This guide will help you set up the database for this project using Prisma.

## Prerequisites

- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (or your preferred database; update `prisma/schema.prisma` accordingly)

## 1. Install Dependencies

Run the following command in the project root:

```powershell
npm install
```

## 2. Configure Database Connection

Edit the `DATABASE_URL` in `prisma/schema.prisma` or create a `.env` file in the project root:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

Replace `USER`, `PASSWORD`, `HOST`, `PORT`, and `DATABASE` with your database credentials.

## 3. Run Prisma Migrations

To set up the database schema, run:

```powershell
npx prisma migrate dev --name init
```

This will apply migrations and generate the Prisma client.

## 4. Seed the Database (Optional)

If you have a seed script, run:

```powershell
npx prisma db seed
```

## 5. Open Prisma Studio (Optional)

To view and edit data visually:

```powershell
npx prisma studio
```

## 6. Start the Application

Run the app from the root directory:

```powershell
npm run dev
```

## Updating the Schema

Whenever you make changes to `prisma/schema.prisma`, follow these steps:

1. **Create and apply a migration:**

   ```powershell
   npx prisma migrate dev --name <migration-name>
   ```

   Replace `<migration-name>` with a descriptive name for your migration.

2. **Regenerate the Prisma client:**
   ```powershell
   npx prisma generate
   ```

This ensures your database and Prisma client are both up to date with the latest schema changes.

## Troubleshooting

- Ensure your database server is running and accessible.
- Check your `DATABASE_URL` for typos.
- For more help, see the [Prisma Docs](https://www.prisma.io/docs/).

---

Feel free to reach out if you encounter any issues during setup!
