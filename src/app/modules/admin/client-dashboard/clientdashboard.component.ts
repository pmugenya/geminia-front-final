import { Component, OnInit, ViewEncapsulation, ViewChild, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { PendingQuote, PolicyRecord, RecentActivity } from '../../../core/user/user.types';
import { UserService } from '../../../core/user/user.service';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { finalize, forkJoin } from 'rxjs';
import { QuoteService } from '../../../core/services/quote.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QuoteProductDialogsComponent } from '../quote-product-dialog/quote-product-dialog.component';

// Chart options interface
interface ApexChartOptions {
    chart: any;
    colors: string[];
    fill: any;
    series: any[];
    stroke: any;
    tooltip: any;
    xaxis: any;
    yaxis: any;
}


// Claim interface for client
interface Claim {
    claimNumber: string;
    policyNumber: string;
    type: string;
    date: string;
    amount: number;
    status: 'submitted' | 'processing' | 'approved' | 'paid' | 'rejected';
}

// Dashboard data interface for client
interface ClientDashboardData {
    myPolicies: {
        total: number;
        active: number;
        expiringSoon: number;
        totalCoverage: number;
        annualPremium: number;
    };
    myClaims: {
        total: number;
        pending: number;
        approved: number;
        totalReceived: number;
    };
    upcomingPayments: {
        totalDue: number;
        nextPaymentDate: string;
        nextPaymentAmount: number;
    };
    portfolio: {
        property: number;
        health: number;
        auto: number;
        life: number;
        total: number;
    };
}

@Component({
    selector: 'app-client-insurance-dashboard',
    templateUrl: './clientdashboard.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatProgressBarModule,
        MatTableModule,
        NgApexchartsModule,
        MatCardModule,
        MatDividerModule,
        MatPaginator,
        MatProgressSpinner,
    ],
})
export class ClientInsuranceDashboardComponent implements OnInit,AfterViewInit {
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild('myQuotesTable', { read: MatSort }) sort!: MatSort;
    @ViewChild(MatPaginator) policyPaginator!: MatPaginator;
    @ViewChild('myPoliciesTable', { read: MatSort }) myPoliciesSort!: MatSort;

    // Dashboard data for client
    data: ClientDashboardData = {
        myPolicies: {
            total: 4,
            active: 3,
            expiringSoon: 1,
            totalCoverage: 1250000,
            annualPremium: 4800
        },
        myClaims: {
            total: 3,
            pending: 1,
            approved: 2,
            totalReceived: 8500
        },
        upcomingPayments: {
            totalDue: 1200,
            nextPaymentDate: '2024-02-15',
            nextPaymentAmount: 400
        },
        portfolio: {
            property: 500000,
            health: 300000,
            auto: 250000,
            life: 200000,
            total: 1250000
        },
    };

    myQuotesDataSource = new MatTableDataSource<PendingQuote>();
    myQuotesTableColumns: string[] = ['refno', 'prodName','status','netprem','expiryDates','actions'];

    myPolicyDataSource = new MatTableDataSource<PolicyRecord>();
    myPolicyTableColumns: string[] = ['erprefno','productName','netpremium','coverFrom','coverTo','actions'];

    pageSizeOptions = [5, 10];
    currentPage = 0;

    // Loading states
    isLoading = false;
    isInitialLoad = true;

    // Coverage Distribution Chart Options
    coverageDistributionOptions: ApexChartOptions;

    // Premium Breakdown Chart Options
    premiumBreakdownOptions: ApexChartOptions;
    pendingQuotes: PendingQuote[] = [];
    recentActivities: RecentActivity[] = [];
    totalRecords = 0;
    quotesPage = 0;
    quotesPageSize = 5;

    policiesTotalRecords = 0;
    policiesPage = 0;
    policiesPageSize = 5;


    constructor(  private userService: UserService,
                  private cdr: ChangeDetectorRef,
                  private router: Router,
                  private dialog: MatDialog,
                  private quoteService: QuoteService) {
        // Initialize data sources

        // Initialize coverage distribution chart
        this.coverageDistributionOptions = {
            chart: {
                type: 'donut',
                height: 300,
                fontFamily: 'inherit',
                toolbar: {
                    show: false
                }
            },
            colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
            fill: {
                opacity: 0.9
            },
            series: [500000, 300000, 250000, 200000],
            stroke: {
                width: 0
            },
            tooltip: {
                theme: 'dark',
                y: {
                    formatter: (value: number) => {
                        return this.formatCurrency(value);
                    }
                }
            },
            xaxis: {
                categories: ['Property', 'Health', 'Auto', 'Life']
            },
            yaxis: {
                categories: ['Property', 'Health', 'Auto', 'Life']
            }
        };

        // Initialize premium breakdown chart
        this.premiumBreakdownOptions = {
            chart: {
                type: 'bar',
                height: 200,
                fontFamily: 'inherit',
                toolbar: {
                    show: false
                }
            },
            colors: ['#3B82F6'],
            fill: {
                opacity: 0.8
            },
            series: [{
                name: 'Annual Premium',
                data: [1200, 800, 2000, 800]
            }],
            stroke: {
                width: 0
            },
            tooltip: {
                theme: 'dark'
            },
            xaxis: {
                categories: ['Home', 'Auto', 'Health', 'Life'],
                labels: {
                    style: {
                        colors: '#6B7280'
                    }
                }
            },
            yaxis: {
                labels: {
                    formatter: (value: number) => {
                        return this.formatCurrency(value);
                    }
                }
            }
        };
    }

    ngOnInit(): void {
        this.loadDashboardData();
        this.loadRecentActivities();
    }

    ngAfterViewInit(): void {
         if( this.myQuotesDataSource) {
             this.myQuotesDataSource.paginator = this.paginator;
             this.myQuotesDataSource.sort = this.sort;
         }
         if(this.myPolicyDataSource){
             this.myPolicyDataSource.paginator = this.policyPaginator;
             this.myPolicyDataSource.sort = this.myPoliciesSort;
         }
    }

    loadRecentActivities(): void {
        this.quoteService.getRecentActivities().subscribe({
            next: (data) => {
                this.isLoading = false;
                this.recentActivities=data;
            },
            error: (err) => {
                console.error('Error fetching activities', err);
                this.isLoading = false;
            }
        });
    }

    loadDashboardData(): void {
        this.isLoading = true;
        this.cdr.detectChanges();
        const quotesOffset = this.quotesPage * this.quotesPageSize;
        const policiesOffset = this.policiesPage * this.policiesPageSize;
        forkJoin({
            quotes: this.userService.getClientQuotes(quotesOffset, this.quotesPageSize),
            policies: this.userService.getClientPolicies(policiesOffset, this.policiesPageSize)
        })
         .pipe(
            finalize(() => {
                this.isLoading = false;
                this.isInitialLoad = false;
                this.cdr.detectChanges();
            })
         ).subscribe({
            next: ({ quotes, policies }) => {
                // Convert and assign quotes
                this.myQuotesDataSource.data = quotes.pageItems.map((q: any) => ({
                    ...q,
                    expiryDates: this.toDate(q.expiryDate),
                    prodName: q.prodName === 'MARINE CARGO INSURANCE' ? 'Marine' : q.prodName
                }));

                this.totalRecords = quotes.totalFilteredRecords;

                // Convert and assign policies
                const policiesData = policies.pageItems.map((p: any) => ({
                    ...p,
                    coverFrom: this.toDate(p.dischageDate),
                    coverTo: this.toDate(p.dateArrival),
                }));
                this.myPolicyDataSource.data =  policiesData;
                this.policiesTotalRecords = policies.totalFilteredRecords;

                console.log(policies.pageItems);
            },
            error: (err) => {
                console.error('Error loading dashboard data', err);
            },
        });
    }

    private toDate(dateArray?: number[]): Date | null {
        if (!dateArray || dateArray.length < 3) return null;
        const [year, month, day] = dateArray;
        return new Date(year, month - 1, day); // month is 0-based in JS
    }

    loadPolicies(): void {
        const offset = this.policiesPage * this.policiesPageSize;
        this.userService.getClientPolicies(offset, this.policiesPageSize)
            .pipe(finalize(() => this.cdr.detectChanges()))
            .subscribe({
                next: (res) => {
                    const policiesData = res.pageItems.map((p: any) => ({
                        ...p,
                        coverFrom: this.toDate(p.dischageDate),
                        coverTo: this.toDate(p.dateArrival),
                    }));
                    this.myPolicyDataSource.data = policiesData;
                    this.policiesTotalRecords = res.totalFilteredRecords;
                },
                error: (err) => console.error('Error loading policies', err)
            });
    }

    onPageChange(event: PageEvent): void {
        this.quotesPage = event.pageIndex;
        this.quotesPageSize = event.pageSize;
        this.loadDashboardData();
    }

    onPoliciesPageChange(event: PageEvent): void {
        this.policiesPage = event.pageIndex;
        this.policiesPageSize = event.pageSize;
        this.loadPolicies();
    }

    refreshPolicies(): void {
        this.currentPage = 0;
        this.loadDashboardData();
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    /**
     * Get status color class for policies
     */
    getPolicyStatusColor(status: string): string {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-50';
            case 'DRAFT':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50';
            case 'FINAL':
                return 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-50';
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-50';
            default:
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50';
        }
    }

    /**
     * Get status color class for claims
     */
    getClaimStatusColor(status: string): string {
        switch (status) {
            case 'submitted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-blue-50';
            case 'processing':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-600 dark:text-yellow-50';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-50';
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-600 dark:text-green-50';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-600 dark:text-red-50';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-50';
        }
    }

    /**
     * Format currency
     */
    formatCurrency(value: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    /**
     * Format date
     */
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Calculate days until renewal
     */
    getDaysUntilRenewal(renewalDate: string): number {
        const today = new Date();
        const renewal = new Date(renewalDate);
        const diffTime = renewal.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Check if policy is expiring soon (within 30 days)
     */
    isExpiringSoon(renewalDate: string): boolean {
        return this.getDaysUntilRenewal(renewalDate) <= 30;
    }

    /**
     * Make payment for upcoming premium
     */
    makePayment(): void {
        console.log('Initiating payment process...');
        // Implement payment integration
    }

    /**
     * File a new claim
     */
    fileNewClaim(): void {
        console.log('Opening claim filing form...');
        // Navigate to claim filing page
    }

    /**
     * View policy details
     */
    viewPolicy(policy: PolicyRecord): void {
        this.router.navigate(['/viewmarinequote', policy.id]);
    }

    viewQuote(policy: PendingQuote): void {
        this.router.navigate(['/viewquote', policy.quoteId]);
    }

    openProductQuoteDialog(): void {
        const dialogRef = this.dialog.open(QuoteProductDialogsComponent, {
            width: '100%',
            maxWidth: '480px',
            panelClass: ['fuse-dialog'],
            autoFocus: false
        });

        dialogRef.afterClosed().subscribe((selectedProduct) => {
            if (selectedProduct) {
                if(selectedProduct==='Marine'){
                    this.router.navigate(['/marinequote']);
                }
                else{

                }
            }
        });
    }

    /**
     * Renew a policy
     */
    renewPolicy(policy: PendingQuote): void {
        console.log('Renewing policy:', policy.refno);
        // Implement renewal process
    }

    /**
     * Download policy document
     */
    downloadPolicy(policy: PendingQuote): void {
        console.log('Downloading policy document for:', policy.refno);
        // Implement document download
    }

    buyPolicy(policy: PendingQuote): void {
        console.log('Downloading policy document for:', policy.refno);
        // Implement document download
    }

    /**
     * Contact support
     */
    contactSupport(): void {
        console.log('Opening support contact form...');
        // Implement support contact
    }

    /**
     * Get activity icon based on type
     */
    getActivityIcon(type: string): string {
        switch (type) {
            case 'QUOTE':
                return 'heroicons_outline:credit-card';
            case 'claim':
                return 'heroicons_outline:clipboard-document-check';
            case 'APPLICATION':
                return 'heroicons_outline:document-text';
            default:
                return 'heroicons_outline:bell';
        }
    }

    /**
     * Get activity color based on type
     */
    getActivityColor(type: string): string {
        switch (type) {
            case 'payment':
                return 'text-blue-600 bg-blue-100 dark:bg-blue-600 dark:text-blue-100';
            case 'claim':
                return 'text-green-600 bg-green-100 dark:bg-green-600 dark:text-green-100';
            case 'policy':
                return 'text-purple-600 bg-purple-100 dark:bg-purple-600 dark:text-purple-100';
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-600 dark:text-gray-100';
        }
    }

    /**
     * Calculate total monthly premium
     */
    getMonthlyPremium(): number {
        return this.data.myPolicies.annualPremium / 12;
    }

    /**
     * Get coverage distribution percentages
     */
    getCoverageDistribution(): { type: string; amount: number; percentage: number }[] {
        const total = this.data.portfolio.total;
        return [
            {
                type: 'Property',
                amount: this.data.portfolio.property,
                percentage: (this.data.portfolio.property / total) * 100
            },
            {
                type: 'Health',
                amount: this.data.portfolio.health,
                percentage: (this.data.portfolio.health / total) * 100
            },
            {
                type: 'Auto',
                amount: this.data.portfolio.auto,
                percentage: (this.data.portfolio.auto / total) * 100
            },
            {
                type: 'Life',
                amount: this.data.portfolio.life,
                percentage: (this.data.portfolio.life / total) * 100
            }
        ];
    }


    /**
     * Get progress bar color based on coverage type
     */
    getProgressColor(coverageType: string): string {
        switch (coverageType) {
            case 'Property':
                return 'primary';
            case 'Health':
                return 'accent';
            case 'Auto':
                return 'warn';
            case 'Life':
                return 'primary';
            default:
                return 'primary';
        }
    }
}
