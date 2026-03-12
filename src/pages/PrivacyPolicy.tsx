import React from 'react';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, ShieldCheck, Lock, Eye, UserCheck, Globe, Database,
    Bell, Trash2, FileText, Mail, Cookie, RefreshCw
} from 'lucide-react';
import { ContactFormModal } from '@/components/modals/ContactFormModal';

const Section = ({
    icon: Icon,
    iconColor,
    iconBg,
    title,
    children,
}: {
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    title: string;
    children: React.ReactNode;
}) => (
    <section className="space-y-4">
        <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`${iconColor} h-5 w-5`} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>
        <div className="text-slate-600 space-y-3 leading-relaxed">{children}</div>
    </section>
);

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-white text-slate-900">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-[100] flex items-center justify-between px-8">
                <a href="/" className="hover:opacity-80 transition-opacity">
                    <span className="text-lg font-bold tracking-tight text-slate-900">ProjectOye</span>
                </a>
                <a href="/">
                    <Button variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                        <ArrowLeft size={16} /> Back to Home
                    </Button>
                </a>
            </header>

            <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
                {/* Hero */}
                <div className="mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-6">
                        <ShieldCheck size={12} />
                        <span>Last Updated: February 21, 2026</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-5 text-slate-900">Privacy Policy</h1>
                    <p className="text-xl text-slate-600 leading-relaxed max-w-3xl">
                        At ProjectOye, your trust is not taken for granted. This policy explains exactly what data we
                        collect, why we collect it, how we protect it, and your rights as a user.
                    </p>
                </div>

                {/* TOC */}
                <div className="mb-14 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">Table of Contents</p>
                    <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-indigo-600 font-medium">
                        {[
                            'Information We Collect', 'How We Use Your Information',
                            'Data Security', 'Data Sharing & Third Parties',
                            'Cookies & Tracking', 'Data Retention',
                            'Your Rights', 'International Transfers',
                            'Children\'s Privacy', 'Changes to This Policy',
                            'Contact Us',
                        ].map((item, i) => (
                            <li key={i} className="hover:underline cursor-pointer">
                                {i + 1}. {item}
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="space-y-14 text-slate-600">
                    {/* 1 */}
                    <Section icon={Eye} iconColor="text-indigo-600" iconBg="bg-indigo-100" title="1. Information We Collect">
                        <p>We collect the minimum data needed to provide a world-class project management experience.</p>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">Account & Profile Data</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Name, email address, and password (hashed, never stored in plain text)</li>
                                    <li>Profile photo (optional)</li>
                                    <li>Organization name and role</li>
                                    <li>Timezone and locale preferences</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">Project & Work Data</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Projects, tasks, milestones, and comments you create</li>
                                    <li>Files and attachments you upload</li>
                                    <li>Time logs, budget entries, and status updates</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">Usage & Technical Data</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>IP address, browser type, operating system</li>
                                    <li>Pages visited, features used, session duration</li>
                                    <li>Error logs and crash reports (to improve reliability)</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-800 mb-1">Billing Data</h3>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Subscription plan, billing cycle, invoice history</li>
                                    <li>Payment details are handled exclusively by Stripe — we never store raw card numbers</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    {/* 2 */}
                    <Section icon={FileText} iconColor="text-violet-600" iconBg="bg-violet-100" title="2. How We Use Your Information">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Provide the service</strong> — authenticate you, render your projects, and sync changes in real time</li>
                            <li><strong>AI features</strong> — power Morning Briefings, risk detection, and AI estimation using your project data (processed on your workspace only; never shared across workspaces)</li>
                            <li><strong>Product improvement</strong> — aggregate, anonymised analytics to improve features and performance</li>
                            <li><strong>Security</strong> — detect fraud, abuse, and unauthorized access</li>
                            <li><strong>Communications</strong> — send transactional emails (password reset, invites) and, with your consent, product updates</li>
                            <li><strong>Legal compliance</strong> — respond to lawful requests from government authorities</li>
                        </ul>
                        <p>We <strong>do not</strong> sell your data, use it to train third-party AI models, or share it for advertising.</p>
                    </Section>

                    {/* 3 */}
                    <Section icon={Lock} iconColor="text-rose-600" iconBg="bg-rose-100" title="3. Data Security">
                        <p>We apply enterprise-grade security controls at every layer:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Encryption in transit:</strong> TLS 1.3 on all connections</li>
                            <li><strong>Encryption at rest:</strong> AES-256 for all database storage</li>
                            <li><strong>Multi-tenant isolation:</strong> Row-Level Security (RLS) enforces that one tenant can never read another tenant's data</li>
                            <li><strong>Access controls:</strong> Role-Based Access Control (RBAC) with least-privilege principles; all admin actions are audit-logged</li>
                            <li><strong>Infrastructure:</strong> Hosted on Supabase (AWS-backed), SOC 2 Type II certified data centres in your chosen region</li>
                            <li><strong>Penetration testing:</strong> Annual third-party security assessments</li>
                            <li><strong>Incident response:</strong> 24-hour breach notification for affected users in line with GDPR Article 33</li>
                        </ul>
                        <p className="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800">
                            Despite best efforts, no system is 100% secure. If you discover a vulnerability, please responsibly disclose it to <strong>security@projectoye.com</strong>.
                        </p>
                    </Section>

                    {/* 4 */}
                    <Section icon={Globe} iconColor="text-teal-600" iconBg="bg-teal-100" title="4. Data Sharing & Third Parties">
                        <p>We share data only in these limited circumstances:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Service providers:</strong> Stripe (payments), SendGrid (email), AWS/Supabase (infrastructure). Each is bound by Data Processing Agreements (DPAs).</li>
                            <li><strong>Team members you invite:</strong> When you add members to a project, they access the data you grant them — nothing more.</li>
                            <li><strong>Business transfers:</strong> In the event of a merger or acquisition, your data may be transferred. You will be notified 30 days in advance.</li>
                            <li><strong>Legal requirements:</strong> We may disclose data when required by law (e.g., court order), after legal review.</li>
                        </ul>
                        <p>We <strong>never</strong> sell or rent your data to advertisers or data brokers.</p>
                    </Section>

                    {/* 5 */}
                    <Section icon={Cookie} iconColor="text-amber-600" iconBg="bg-amber-100" title="5. Cookies & Tracking">
                        <p>We use a minimal set of cookies:</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700">
                                        <th className="text-left p-3 font-semibold rounded-tl-lg">Cookie</th>
                                        <th className="text-left p-3 font-semibold">Purpose</th>
                                        <th className="text-left p-3 font-semibold rounded-tr-lg">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        ['sb-auth-token', 'Supabase authentication session', '7 days'],
                                        ['projectoye-theme', 'Dark/light mode preference', '1 year'],
                                        ['projectoye-sidebar', 'Sidebar state preference', 'Session'],
                                    ].map(([name, purpose, duration]) => (
                                        <tr key={name} className="hover:bg-slate-50">
                                            <td className="p-3 font-mono text-xs text-indigo-700">{name}</td>
                                            <td className="p-3">{purpose}</td>
                                            <td className="p-3 text-slate-500">{duration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p>We do not use advertising cookies or third-party tracking pixels.</p>
                    </Section>

                    {/* 6 */}
                    <Section icon={Database} iconColor="text-blue-600" iconBg="bg-blue-100" title="6. Data Retention">
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Active account data:</strong> Retained for as long as your workspace is active</li>
                            <li><strong>Deleted content:</strong> Soft-deleted for 30 days (so you can restore), then permanently purged</li>
                            <li><strong>Closed accounts:</strong> Personal data deleted within 90 days of account closure, except where retention is required by law</li>
                            <li><strong>Billing records:</strong> Retained for 7 years per financial regulation requirements</li>
                            <li><strong>Audit logs:</strong> Retained for 2 years for security and compliance purposes</li>
                        </ul>
                    </Section>

                    {/* 7 */}
                    <Section icon={UserCheck} iconColor="text-emerald-600" iconBg="bg-emerald-100" title="7. Your Rights">
                        <p>Depending on your location, you may have these rights under GDPR, CCPA, or similar laws:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Access:</strong> Request a copy of all personal data we hold about you</li>
                            <li><strong>Correction:</strong> Request that inaccurate data be corrected</li>
                            <li><strong>Deletion ("Right to be Forgotten"):</strong> Request deletion of your personal data</li>
                            <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
                            <li><strong>Restriction:</strong> Request that we stop processing your data while a dispute is resolved</li>
                            <li><strong>Objection:</strong> Object to processing based on legitimate interest</li>
                            <li><strong>Non-discrimination:</strong> Exercise your rights without receiving a degraded service (CCPA)</li>
                        </ul>
                        <p>To exercise any of these rights, contact <strong>privacy@projectoye.com</strong> or use the button below. We respond within 30 days.</p>
                        <ContactFormModal defaultSubject="Privacy Rights Request">
                            <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                                Submit a Privacy Request →
                            </Button>
                        </ContactFormModal>
                    </Section>

                    {/* 8 */}
                    <Section icon={Globe} iconColor="text-cyan-600" iconBg="bg-cyan-100" title="8. International Data Transfers">
                        <p>
                            ProjectOye is incorporated in the United States. If you are accessing the service from the
                            European Economic Area (EEA), UK, or other regions with data transfer restrictions, your data
                            may be transferred to the US.
                        </p>
                        <p>
                            We ensure adequate protection through Standard Contractual Clauses (SCCs) approved by the
                            European Commission, and Supabase's infrastructure is ISO 27001 certified.
                        </p>
                    </Section>

                    {/* 9 */}
                    <Section icon={UserCheck} iconColor="text-pink-600" iconBg="bg-pink-100" title="9. Children's Privacy">
                        <p>
                            ProjectOye is not directed at children under 16 years of age. We do not knowingly collect
                            personal information from children. If you believe we have inadvertently collected data from
                            a child, please contact us immediately and we will delete it.
                        </p>
                    </Section>

                    {/* 10 */}
                    <Section icon={RefreshCw} iconColor="text-slate-600" iconBg="bg-slate-100" title="10. Changes to This Policy">
                        <p>
                            We may update this policy as our product evolves. When we make material changes, we will
                            notify you via email and an in-app notice at least 30 days before the change takes effect.
                            Continued use of the service after the effective date constitutes acceptance of the updated policy.
                        </p>
                        <p>
                            You can always find the latest version at <strong>projectoye.com/privacy</strong>.
                            Previous versions are available on request.
                        </p>
                    </Section>

                    {/* 11 */}
                    <Section icon={Mail} iconColor="text-indigo-600" iconBg="bg-indigo-100" title="11. Contact Us">
                        <p>For any privacy questions, requests, or concerns:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="font-semibold text-slate-800 mb-1">Privacy Team</p>
                                <p className="text-sm">privacy@projectoye.com</p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <p className="font-semibold text-slate-800 mb-1">Data Protection Officer</p>
                                <p className="text-sm">dpo@projectoye.com</p>
                            </div>
                        </div>
                        <div className="mt-2">
                            <ContactFormModal defaultSubject="Privacy Policy Inquiry">
                                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Contact Privacy Team →
                                </Button>
                            </ContactFormModal>
                        </div>
                    </Section>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicy;
