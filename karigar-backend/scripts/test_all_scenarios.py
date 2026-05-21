import asyncio
import httpx
import json
import time

BASE_URL = "http://localhost:8000"

async def test_scenario(name: str, path: str, method: str = "POST", payload: dict = None) -> bool:
    print(f"\n======================================")
    print(f"🔄 SCENARIO: {name}")
    print(f"======================================")
    
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            if method == "POST":
                res = await client.post(f"{BASE_URL}{path}", json=payload)
            else:
                res = await client.get(f"{BASE_URL}{path}")
            
            res.raise_for_status()
            data = res.json()
            dur = time.time() - start
            print(f"✅ PASS  ({dur:.2f}s) -> {path}")
            print("Response Sample:", json.dumps(data, indent=2)[:500] + "...\n")
            return True

    except Exception as e:
        dur = time.time() - start
        print(f"❌ FAIL  ({dur:.2f}s) -> {str(e)}")
        return False

async def main():
    print("🚀 Starting API scenarios test...\n")
    
    tests = [
        test_scenario(
            "1. Health & Agent Load", 
            "/api/health/agents", 
            "GET"
        ),
        test_scenario(
            "2. Fetch All Seeded Providers", 
            "/api/providers", 
            "GET"
        ),
        test_scenario(
            "3. End-to-End Orchestration (Urgent AC repair, budget 500)", 
            "/api/request", 
            "POST",
            {
                "session_id": "test-stress-1",
                "user_id": "user-stress1",
                "message": "AC bilkul thand nahi kar raha urgent hai budget 500 G-13"
            }
        ),
        test_scenario(
            "4. Provider Cancellation & Auto-Recovery", 
            "/api/simulate/cancel/MOCK-123", 
            "POST",
            {}
        ),
        test_scenario(
            "5. Dispute Initialization", 
            "/api/booking/MOCK-123/dispute", 
            "POST",
            {
                "reason": "The provider charged me extra 200 PKR and didn't fix the leak"
            }
        )
    ]
    
    results = await asyncio.gather(*tests)
    
    print("\n" + "="*40)
    print("🏆 FINAL RESULTS SUMMARY")
    print("="*40)
    passed = results.count(True)
    total = len(results)
    print(f"PASSED: {passed}/{total}")
    if passed == total:
        print("ALL SYSTEMS GO 🟢")
    else:
        print("SOME TESTS FAILED 🔴")

if __name__ == "__main__":
    asyncio.run(main())
