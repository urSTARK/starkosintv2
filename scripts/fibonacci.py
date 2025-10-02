def fibonacci(n):
    fib_sequence = [0, 1]
    for i in range(2, n):
        fib_sequence.append(fib_sequence[i-1] + fib_sequence[i-2])
    return fib_sequence

print("=== Fibonacci Sequence ===")
n = 15
sequence = fibonacci(n)
print(f"First {n} Fibonacci numbers:")
print(", ".join(map(str, sequence)))
print(f"\nSum of sequence: {sum(sequence)}")
