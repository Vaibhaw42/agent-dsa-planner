import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LeetCodeGraphQLClient } from '@/infrastructure/leetcode/LeetCodeGraphQLClient'

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('LeetCodeGraphQLClient', () => {
  let client: LeetCodeGraphQLClient

  beforeEach(() => {
    client = new LeetCodeGraphQLClient()
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getUserStats', () => {
    it('returns user stats for public profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            matchedUser: {
              submitStats: {
                acSubmissionNum: [
                  { difficulty: 'All', count: 150, submissions: 300 },
                  { difficulty: 'Easy', count: 80, submissions: 100 },
                  { difficulty: 'Medium', count: 60, submissions: 150 },
                  { difficulty: 'Hard', count: 10, submissions: 50 },
                ],
              },
              profile: { ranking: 12345 },
            },
          },
        }),
      })

      const result = await client.getUserStats('testuser')
      expect(result).not.toBeNull()
      expect(result?.totalSolved).toBe(150)
      expect(result?.easySolved).toBe(80)
      expect(result?.mediumSolved).toBe(60)
      expect(result?.hardSolved).toBe(10)
      expect(result?.totalSubmissions).toBe(300)
      expect(result?.ranking).toBe(12345)
    })

    it('returns null for private/non-existent profile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { matchedUser: null } }),
      })

      const result = await client.getUserStats('nonexistent')
      expect(result).toBeNull()
    })

    it('throws on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 429 })
      await expect(client.getUserStats('testuser')).rejects.toThrow('LeetCode API error: 429')
    })

    it('throws on GraphQL errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errors: [{ message: 'Rate limit exceeded' }],
          data: null,
        }),
      })
      await expect(client.getUserStats('testuser')).rejects.toThrow('LeetCode GraphQL error')
    })
  })

  describe('getTopicStats', () => {
    it('returns merged topic stats from all tiers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            matchedUser: {
              tagProblemCounts: {
                advanced: [{ tagName: 'Dynamic Programming', tagSlug: 'dynamic-programming', problemsSolved: 15 }],
                intermediate: [{ tagName: 'Binary Tree', tagSlug: 'binary-tree', problemsSolved: 20 }],
                fundamental: [{ tagName: 'Array', tagSlug: 'array', problemsSolved: 45 }],
              },
            },
          },
        }),
      })

      const result = await client.getTopicStats('testuser')
      expect(result).toHaveLength(3)
      const dp = result.find((t) => t.tagSlug === 'dynamic-programming')
      expect(dp?.problemsSolved).toBe(15)
      const arr = result.find((t) => t.tagSlug === 'array')
      expect(arr?.problemsSolved).toBe(45)
    })

    it('returns empty array when profile not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { matchedUser: null } }),
      })
      const result = await client.getTopicStats('nonexistent')
      expect(result).toEqual([])
    })
  })

  describe('getContestInfo', () => {
    it('returns contest info when available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            userContestRanking: {
              rating: 1542.3,
              globalRanking: 8000,
              attendedContestsCount: 12,
            },
          },
        }),
      })

      const result = await client.getContestInfo('testuser')
      expect(result).not.toBeNull()
      expect(result?.rating).toBe(1542.3)
      expect(result?.ranking).toBe(8000)
      expect(result?.attendedContestsCount).toBe(12)
    })

    it('returns null when user has no contest history', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { userContestRanking: null } }),
      })
      const result = await client.getContestInfo('testuser')
      expect(result).toBeNull()
    })
  })
})
