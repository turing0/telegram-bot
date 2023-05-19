import Link from 'next/link'
import Layout from '../components/Layout'
import '../styles/globals.css'

const IndexPage = () => (
  <Layout title="Home | Next.js + TypeScript Example">
    {/* <h1>Hello Next.js 👋</h1> */}
    <h1 className="text-4xl text-center py-4">Hello Next.js 👋</h1>
    <p className="text-center">
      <Link href="/about">
        <a className="text-blue-500 hover:underline">About</a>
      </Link>
    </p>
    {/* <p>
      <Link href="/about">About</Link>
    </p> */}
  </Layout>
)

export default IndexPage
