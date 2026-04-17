"""
Non-optimized matrix multiplication in pure Python
Inefficiencies:
- Triple nested loops (O(n³)) with Python-level iteration
- List of lists -> many attribute lookups
- No contiguous memory or cache blocking
- Dynamic type checking for every operation
"""

import random
import time

def create_random_matrix(rows, cols):
    """Create a rows x cols matrix filled with random floats."""
    return [[random.random() for _ in range(cols)] for _ in range(rows)]

def multiply_naive(A, B):
    """Naive O(n³) matrix multiplication: C = A * B."""
    n = len(A)            # assuming square matrices
    m = len(B[0])
    p = len(B)            # = len(A[0]) for valid multiplication
    # Initialize result with zeros
    C = [[0.0 for _ in range(m)] for _ in range(n)]
    # Triple loop: i, j, k
    for i in range(n):
        for j in range(m):
            total = 0.0
            for k in range(p):
                total += A[i][k] * B[k][j]
            C[i][j] = total
    return C

if __name__ == "__main__":
    SIZE = 500   # 500x500 is already very slow; 1000x1000 may take minutes
    print(f"Matrix size: {SIZE}x{SIZE}")

    A = create_random_matrix(SIZE, SIZE)
    B = create_random_matrix(SIZE, SIZE)

    start = time.perf_counter()
    C = multiply_naive(A, B)
    end = time.perf_counter()

    print(f"Naive multiplication took: {end - start:.2f} seconds")
    print("Sample result [0][0]:", C[0][0])
