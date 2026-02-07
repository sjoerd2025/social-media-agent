import { describe, it, expect } from "@jest/globals";
import { chunkArray } from "../agents/utils.js";

describe("chunkArray", () => {
  it("should split an array into equal chunks", () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
    ]);
  });

  it("should handle the last chunk being smaller", () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("should handle an empty array", () => {
    const arr: number[] = [];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([]);
  });

  it("should handle chunk size larger than the array length", () => {
    const arr = [1, 2, 3];
    const chunks = chunkArray(arr, 5);
    expect(chunks).toEqual([[1, 2, 3]]);
  });

  it("should handle chunk size of 1", () => {
    const arr = [1, 2, 3];
    const chunks = chunkArray(arr, 1);
    expect(chunks).toEqual([[1], [2], [3]]);
  });

  it("should work with strings", () => {
    const arr = ["a", "b", "c", "d"];
    const chunks = chunkArray(arr, 3);
    expect(chunks).toEqual([["a", "b", "c"], ["d"]]);
  });

  it("should work with objects", () => {
    const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([[{ id: 1 }, { id: 2 }], [{ id: 3 }]]);
  });
});
