import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function PrivacyPolicy() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px 20px',
      color: '#FFFFFF',
      backgroundColor: '#18181B',
      fontFamily: 'Inter, sans-serif',
      lineHeight: '1.6',
      minHeight: '100vh'
    }}>
      <Helmet>
        <title>Privacy Policy & Terms of Service | Opinar</title>
        <meta name="description" content="Learn how Opinar protects citizen privacy, secures public open questions, ensures anonymous civic voting, and transparently processes Indian election data." />
        <meta name="keywords" content="Opinar privacy policy, civic platform terms, voter data privacy India, public voice platform privacy, citizen data protection India" />
        <link rel="canonical" href="https://www.opinar.in/privacy-policy" />
      </Helmet>

      <h1 style={{ fontSize: '32px', borderBottom: '1px solid #3F3F46', paddingBottom: '16px', marginBottom: '24px' }}>
        PRIVACY POLICY & TERMS OF SERVICE
      </h1>

      <p><strong>Effective Date: October 20, 2026</strong></p>

      <p>This Privacy Policy explains how <strong>Opinar</strong> ("Opinar," "the Platform," "we," "us," or "our") handles user information when you access or use <strong>https://www.opinar.in</strong>, our mobile interfaces, and related civic services.</p>

      <p>Opinar is an independent civic intelligence and public voice platform dedicated to political transparency, democratic engagement, and election data analytics across India. We are committed to protecting your personal privacy while enabling verified citizen participation.</p>

      <h2 style={{ marginTop: '32px', color: '#FFFFFF' }}>1. Information We Collect</h2>
      <p>When you use Opinar, we collect minimal data necessary to deliver verified civic features:</p>
      <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
        <li><strong>Account Authentication:</strong> When you register via Google Sign-In or email, we receive your name, verified email address, and profile avatar to maintain user authentication.</li>
        <li><strong>Public Open Questions & Discussions:</strong> Questions, insights, and comments you publicly post to politician profiles or community feeds are visible to other citizens.</li>
        <li><strong>Anonymous Civic Polling:</strong> When you participate in official election polls or community surveys, your vote selection is recorded anonymously to guarantee polling integrity and prevent ballot stuffing.</li>
      </ul>

      <h2 style={{ marginTop: '32px', color: '#FFFFFF' }}>2. Public Election & Politician Data Transparency</h2>
      <p>Election returns, historical candidate records, vote margins, and politician portfolios indexed on Opinar are compiled from open public records published by the Election Commission of India (ECI), State Election Commissions, and official government gazettes.</p>

      <h2 style={{ marginTop: '32px', color: '#FFFFFF' }}>3. How We Use and Protect Your Data</h2>
      <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
        <li>We <strong>do not sell</strong> your personal data to third-party data brokers or advertisers.</li>
        <li>All authentication and database interactions run through isolated Cloud Firestore instances with strict server-side authorization rules.</li>
        <li>We use standard security headers, HTTPS SSL encryption, and secure tokens.</li>
      </ul>

      <h2 style={{ marginTop: '32px', color: '#FFFFFF' }}>4. User Rights & Account Deletion</h2>
      <p>You have full control over your civic profile. You can delete your posted open questions or request account deletion at any time by contacting our support team at <strong>support@opinar.in</strong>.</p>
    </div>
  );
}
