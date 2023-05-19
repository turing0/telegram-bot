import { NextApiRequest, NextApiResponse } from 'next'
import { sampleUserData } from '../../../utils/sample-data'

const handler = (_req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (!Array.isArray(sampleUserData)) {
      throw new Error('Cannot find user data')
    }

    // Assume you're getting the user data in the request body
    const { id, ...data } = _req.body

    // Find the user in the array
    const userIndex = sampleUserData.findIndex(user => user.id === id)

    if (userIndex === -1) {
      throw new Error('User not found')
    }

    // Update the user data
    sampleUserData[userIndex] = { ...sampleUserData[userIndex], ...data }

    res.status(200).json(sampleUserData[userIndex])

  } catch (err: any) {
    res.status(500).json({ statusCode: 500, message: err.message })
  }
}

export default handler
