"""Quick registration test."""
import asyncio, sys
sys.path.insert(0, '.')

async def main():
    from app.core.database import engine, async_session_factory, init_db, Base
    import bcrypt
    
    # Create all tables
    await init_db()
    print("✓ DB init OK")
    
    async with async_session_factory() as session:
        from sqlalchemy import select, delete, text
        from app.models.models import User
        from app.core.security import create_internal_token, generate_uuid
        
        # Clean test user
        await session.execute(text("DELETE FROM users WHERE email = 'test@ledgerleaf.ai'"))
        await session.commit()
        
        # Register
        pw_hash = bcrypt.hashpw(b"TestPass123!", bcrypt.gensalt()).decode("utf-8")
        user = User(id=generate_uuid(), email="test@ledgerleaf.ai", full_name="Test User", password_hash=pw_hash)
        session.add(user)
        await session.commit()
        await session.refresh(user)
        print(f"✓ User created: id={user.id}, email={user.email}")
        
        # Verify login
        result = await session.execute(select(User).where(User.email == "test@ledgerleaf.ai"))
        db_user = result.scalar_one()
        ok = bcrypt.checkpw(b"TestPass123!", db_user.password_hash.encode("utf-8"))
        print(f"✓ Password verify: {ok}")
        
        # Generate token
        token = create_internal_token(db_user.id)
        print(f"✓ JWT token generated (len={len(token)})")
        
        print("\n=== REGISTRATION TEST: PASS ===" if ok else "\n=== REGISTRATION TEST: FAIL ===")

asyncio.run(main())
