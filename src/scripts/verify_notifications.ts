/**
 * Notification Integration Verification Script
 * Tests the complete notification flow for governance events
 */

import { sendNotification } from '../services/governanceNotificationService';

interface VerificationResult {
    test: string;
    passed: boolean;
    error?: string;
}

const results: VerificationResult[] = [];

async function testApprovalAssigned(): Promise<void> {
    console.log('\n🧪 Testing Approval Assigned Notification...');
    try {
        await sendNotification('test-user-id', 'approval_assigned', 'test-approval-1', {
            userName: 'John Doe',
            approvalTitle: 'Budget Approval Q1 2026',
            entityName: 'Marketing Project',
            entityType: 'project',
            dueDate: '2026-02-20',
            requesterName: 'Jane Smith',
            approvalUrl: 'https://app.projectoye.com/approvals/123',
        } as any);
        results.push({ test: 'Approval Assigned', passed: true });
        console.log('✅ Approval Assigned notification sent successfully');
    } catch (error) {
        results.push({ test: 'Approval Assigned', passed: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.error('❌ Approval Assigned notification failed:', error);
    }
}

async function testApprovalApproved(): Promise<void> {
    console.log('\n🧪 Testing Approval Approved Notification...');
    try {
        await sendNotification('test-user-id', 'approval_approved', 'test-approval-2', {
            userName: 'Jane Smith',
            approvalTitle: 'Budget Approval Q1 2026',
            approverName: 'John Doe',
            approvedAt: new Date().toISOString(),
            comments: 'Looks good, approved!',
        } as any);
        results.push({ test: 'Approval Approved', passed: true });
        console.log('✅ Approval Approved notification sent successfully');
    } catch (error) {
        results.push({ test: 'Approval Approved', passed: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.error('❌ Approval Approved notification failed:', error);
    }
}

async function testApprovalRejected(): Promise<void> {
    console.log('\n🧪 Testing Approval Rejected Notification...');
    try {
        await sendNotification('test-user-id', 'approval_rejected', 'test-approval-3', {
            userName: 'Jane Smith',
            approvalTitle: 'Budget Approval Q1 2026',
            approverName: 'John Doe',
            rejectedAt: new Date().toISOString(),
            comments: 'Budget needs revision',
        } as any);
        results.push({ test: 'Approval Rejected', passed: true });
        console.log('✅ Approval Rejected notification sent successfully');
    } catch (error) {
        results.push({ test: 'Approval Rejected', passed: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.error('❌ Approval Rejected notification failed:', error);
    }
}

async function testDelegationReceived(): Promise<void> {
    console.log('\n🧪 Testing Delegation Received Notification...');
    try {
        await sendNotification('test-user-id', 'delegation_received', 'test-delegation-1', {
            userName: 'Bob Wilson',
            approvalTitle: 'Budget Approval Q1 2026',
            delegatorName: 'John Doe',
            delegationType: 'temporary',
            delegationReason: 'Out of office',
            approvalUrl: 'https://app.projectoye.com/approvals/123',
        } as any);
        results.push({ test: 'Delegation Received', passed: true });
        console.log('✅ Delegation Received notification sent successfully');
    } catch (error) {
        results.push({ test: 'Delegation Received', passed: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.error('❌ Delegation Received notification failed:', error);
    }
}

async function testAdminOverride(): Promise<void> {
    console.log('\n🧪 Testing Admin Override Notification...');
    try {
        await sendNotification('test-user-id', 'admin_override', 'test-override-1', {
            userName: 'Jane Smith',
            approvalTitle: 'Budget Approval Q1 2026',
            adminName: 'Admin User',
            overrideReason: 'Emergency approval required',
        } as any);
        results.push({ test: 'Admin Override', passed: true });
        console.log('✅ Admin Override notification sent successfully');
    } catch (error) {
        results.push({ test: 'Admin Override', passed: false, error: error instanceof Error ? error.message : 'Unknown error' });
        console.error('❌ Admin Override notification failed:', error);
    }
}

function printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    console.log(`\nTotal Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter((r) => !r.passed).forEach((r) => {
            console.log(`  - ${r.test}: ${r.error}`);
        });
    }
    console.log('\n' + '='.repeat(60));
    console.log(failed === 0 ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('='.repeat(60) + '\n');
}

export async function runNotificationVerification(): Promise<void> {
    console.log('🚀 Starting Notification Integration Verification...\n');
    await testApprovalAssigned();
    await testApprovalApproved();
    await testApprovalRejected();
    await testDelegationReceived();
    await testAdminOverride();
    printSummary();
}
