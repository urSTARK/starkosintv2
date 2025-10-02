def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

print("=== Prime Numbers (1-100) ===")
primes = [n for n in range(1, 101) if is_prime(n)]
print(f"Found {len(primes)} prime numbers:")
print(", ".join(map(str, primes)))
