/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [

    {
        id   : 'dashboard',
        title: 'Dashboard',
        type : 'basic',
        icon: 'heroicons_outline:user-group',
        link : '/dashboard'
    },
    {
        id: 'user-management',
        title: 'Quotes',
        type: 'collapsable',
        icon: 'heroicons_outline:user-group',
        children: [
            {
                id: 'marinequote',
                title: 'Marine',
                type: 'basic',
                icon: 'heroicons_outline:user-group',
                link: '/marinequote'
            },
            // {
            //     id: 'example2',
            //     title: 'Travel',
            //     type: 'basic',
            //     icon: 'heroicons_outline:user-group',
            //     link: '/example'
            // },
        ]
    },
    // {
    //     id: 'user-management',
    //     title: 'Policies',
    //     type: 'collapsable',
    //     icon: 'heroicons_outline:user-group',
    //     children: [
    //         {
    //             id: 'example',
    //             title: 'Marine',
    //             type: 'basic',
    //             icon: 'heroicons_outline:user-group',
    //             link: '/example'
    //         },
    //         {
    //             id: 'example2',
    //             title: 'Travel',
    //             type: 'basic',
    //             icon: 'heroicons_outline:user-group',
    //             link: '/example'
    //         },
    //     ]
    // },
    // {
    //     id   : 'example',
    //     title: 'Claims',
    //     type : 'basic',
    //     icon: 'heroicons_outline:user-group',
    //     link : '/example'
    // },
];
export const compactNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const futuristicNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
export const horizontalNavigation: FuseNavigationItem[] = [
    {
        id   : 'example',
        title: 'Example',
        type : 'basic',
        icon : 'heroicons_outline:chart-pie',
        link : '/example'
    }
];
