import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// --- WORKSPACES ---
export const useWorkspaces = () => {
    return useQuery({
        queryKey: ['workspaces'],
        queryFn: async () => {
            const { data } = await api.get('/workspaces');
            return data.workspaces;
        }
    });
};

export const useWorkspaceActivities = (workspaceId: string | undefined) => {
    return useQuery({
        queryKey: ['workspaceActivities', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/activities`);
            return data.activities;
        },
        enabled: !!workspaceId
    });
};

export const useWorkspaceStats = (workspaceId: string) => {
    return useQuery({
        queryKey: ['workspaceStats', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return null;
            const { data } = await api.get(`/workspaces/${workspaceId}/stats`);
            return data.stats;
        },
        enabled: !!workspaceId,
        refetchInterval: 5000 // Poll every 5s for real-time feel
    });
};

export const useWorkspaceActiveTasks = (workspaceId: string | undefined) => {
    return useQuery({
        queryKey: ['workspaceActiveTasks', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/active-tasks`);
            return data.tasks;
        },
        enabled: !!workspaceId,
        refetchInterval: 10000 // Poll every 10s
    });
};

export const useCreateWorkspace = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newWorkspace: { name: string; description: string; is_private: boolean }) => {
            const { data } = await api.post('/workspaces', newWorkspace);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
    });
};

export const useInviteToWorkspace = () => {
    return useMutation({
        mutationFn: async ({ workspaceId, username }: { workspaceId: number; username: string }) => {
            const { data } = await api.post(`/workspaces/${workspaceId}/invitations`, { username });
            return data;
        }
    });
};

// --- INBOX / INVITATIONS ---
export const useInboxInvitations = () => {
    return useQuery({
        queryKey: ['invitations'],
        queryFn: async () => {
            const { data } = await api.get('/invitations');
            return data.invitations;
        }
    });
};

export const useRespondInvitation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, status }: { id: number; status: 'accepted' | 'rejected' }) => {
            const { data } = await api.put(`/invitations/${id}/respond`, { status });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            if (variables.status === 'accepted') {
                queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            }
        }
    });
};

export const useWorkspaceMembers = (workspaceId: number | undefined) => {
    return useQuery({
        queryKey: ['workspaceMembers', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/members`);
            return data.members;
        },
        enabled: !!workspaceId
    });
};

export const useRemoveMember = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ workspaceId, userId }: { workspaceId: number; userId: number }) => {
            const { data } = await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['workspaceMembers', variables.workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
        }
    });
};

// --- PROJECTS ---
export const useProjects = (workspaceId: string) => {
    return useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: async () => {
            if (!workspaceId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/projects`);
            return data.projects;
        },
        enabled: !!workspaceId
    });
};

export const useCreateProject = (workspaceId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newProject: { name: string; description: string }) => {
            const { data } = await api.post(`/workspaces/${workspaceId}/projects`, newProject);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaceStats'] });
        }
    });
};

export const useUpdateProject = (workspaceId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { projectId: string; name?: string; description?: string; status?: string; icon?: string; chained_ticket?: string }) => {
            const { data } = await api.put(`/workspaces/${workspaceId}/projects/${updateData.projectId}`, updateData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['workspaceStats'] });
        }
    });
};

export const useProjectMembers = (workspaceId: string, projectId: string) => {
    return useQuery({
        queryKey: ['projectMembers', projectId],
        queryFn: async () => {
            if (!workspaceId || !projectId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/projects/${projectId}/members`);
            return data.members;
        },
        enabled: !!workspaceId && !!projectId
    });
};

export const useAddProjectMember = (workspaceId: string, projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (memberData: { user_id: number; role?: string }) => {
            const { data } = await api.post(`/workspaces/${workspaceId}/projects/${projectId}/members`, memberData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
        }
    });
};

export const useRemoveProjectMember = (workspaceId: string, projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId: number) => {
            const { data } = await api.delete(`/workspaces/${workspaceId}/projects/${projectId}/members/${userId}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectMembers', projectId] });
        }
    });
};

export const useProjectNotes = (workspaceId: string, projectId: string) => {
    return useQuery({
        queryKey: ['projectNotes', projectId],
        queryFn: async () => {
            if (!workspaceId || !projectId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/projects/${projectId}/notes`);
            return data.notes;
        },
        enabled: !!workspaceId && !!projectId
    });
};

export const useCreateProjectNote = (workspaceId: string, projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (noteData: { title: string; content?: string; attachment_url?: string }) => {
            const { data } = await api.post(`/workspaces/${workspaceId}/projects/${projectId}/notes`, noteData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projectNotes', projectId] });
        }
    });
};

// --- TASKS ---
export const useTasks = (workspaceId: string, projectId: string) => {
    return useQuery({
        queryKey: ['tasks', projectId],
        queryFn: async () => {
            if (!workspaceId || !projectId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`);
            return data.tasks;
        },
        enabled: !!workspaceId && !!projectId
    });
};

export const useCreateTask = (workspaceId: string, projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newTask: { title: string; description: string; priority: string; progress?: number; icon?: string }) => {
            const { data } = await api.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, newTask);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
        }
    });
};

export const useUpdateTaskStatus = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { taskId: number; status: string; reviewer_id?: number }) => {
            const { data } = await api.put(`/tasks/${updateData.taskId}/status`, {
                status: updateData.status,
                reviewer_id: updateData.reviewer_id
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['workspaceStats'] });
            queryClient.invalidateQueries({ queryKey: ['taskActivities', variables.taskId] });
        }
    });
};

export const useUpdateTaskAssignee = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { taskId: number; assignee_id: number | null }) => {
            const { data } = await api.put(`/tasks/${updateData.taskId}/assign`, {
                assignee_id: updateData.assignee_id
            });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['taskActivities', variables.taskId] });
        }
    });
};

export const useUpdateTask = (projectId: string) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { taskId: number; title?: string; description?: string; priority?: string; progress?: number; icon?: string }) => {
            const { data } = await api.put(`/tasks/${updateData.taskId}`, updateData);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
            queryClient.invalidateQueries({ queryKey: ['taskActivities', variables.taskId] });
        }
    });
};

export const useTaskActivities = (taskId: number | undefined) => {
    return useQuery({
        queryKey: ['taskActivities', taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const { data } = await api.get(`/tasks/${taskId}/activities`);
            return data.activities;
        },
        enabled: !!taskId
    });
};

export const useTaskLinks = (taskId: number | undefined) => {
    return useQuery({
        queryKey: ['taskLinks', taskId],
        queryFn: async () => {
            if (!taskId) return [];
            const { data } = await api.get(`/tasks/${taskId}/links`);
            return data.links;
        },
        enabled: !!taskId
    });
};

export const useDeleteTaskLink = (taskId: string | number | undefined) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (linkId: number) => {
            const { data } = await api.delete(`/tasks/links/${linkId}`);
            return data;
        },
        onSuccess: () => {
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: ['taskLinks', taskId] });
                queryClient.invalidateQueries({ queryKey: ['taskActivities', taskId] });
            }
        }
    });
};

export const useTaskNotes = (taskId: string | number | undefined) => {
    return useQuery({
        queryKey: ['taskNotes', taskId],
        queryFn: async () => {
            if (!taskId) return null;
            const { data } = await api.get(`/tasks/${taskId}/notes`);
            return data.notes;
        },
        enabled: !!taskId
    });
};

export const useCreateTaskNote = (taskId: string | number | undefined) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (noteData: { content: string, attachment_url?: string }) => {
            const { data } = await api.post(`/tasks/${taskId}/notes`, noteData);
            return data;
        },
        onSuccess: () => {
            if (taskId) {
                queryClient.invalidateQueries({ queryKey: ['taskNotes', taskId] });
            }
        }
    });
};

// --- DASHBOARD ---
export const useQuicklinks = () => {
    return useQuery({
        queryKey: ['quicklinks'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/quicklinks');
            return data.quicklinks;
        }
    });
};

export const useAddQuicklink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newLink: { title: string; url: string }) => {
            const { data } = await api.post('/dashboard/quicklinks', newLink);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quicklinks'] });
        }
    });
};

export const useUpdateQuicklink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }: { id: number; title: string; url: string }) => {
            const { data } = await api.put(`/dashboard/quicklinks/${id}`, updateData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quicklinks'] });
        }
    });
};

export const useDeleteQuicklink = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/dashboard/quicklinks/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['quicklinks'] });
        }
    });
};

export const useRecents = () => {
    return useQuery({
        queryKey: ['recents'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/recents');
            return data.recents;
        }
    });
};

export const useStickies = () => {
    return useQuery({
        queryKey: ['stickies'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/stickies');
            return data.stickies;
        }
    });
};

export const useAddSticky = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newSticky: { content: string; color?: string }) => {
            const { data } = await api.post('/dashboard/stickies', newSticky);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stickies'] });
        }
    });
};

export const useUpdateSticky = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }: { id: number; content: string; color?: string }) => {
            const { data } = await api.put(`/dashboard/stickies/${id}`, updateData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stickies'] });
        }
    });
};

export const useDeleteSticky = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/dashboard/stickies/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stickies'] });
        }
    });
};

export const useTodos = (filter: string) => {
    return useQuery({
        queryKey: ['todos', filter],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/todos?filter=${filter}`);
            return data.todos;
        }
    });
};

export const useAddTodo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newTodo: { content: string; filter: string }) => {
            const { data } = await api.post('/dashboard/todos', newTodo);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['todos', variables.filter] });
        }
    });
};

export const useUpdateTodo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }: { id: number; content?: string; is_completed?: boolean; filter: string }) => {
            const { data } = await api.put(`/dashboard/todos/${id}`, updateData);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['todos', variables.filter] });
        }
    });
};

export const useDeleteTodo = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, filter }: { id: number; filter: string }) => {
            const { data } = await api.delete(`/dashboard/todos/${id}`);
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['todos', variables.filter] });
        }
    });
};

export const useReorderTodos = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ items, filter }: { items: { id: number; position: number }[]; filter: string }) => {
            const { data } = await api.put('/dashboard/todos/reorder', { items });
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['todos', variables.filter] });
        }
    });
};

export const useWeeklyDashboardReport = (startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['weeklyDashboardReport', startDate, endDate],
        queryFn: async () => {
            const { data } = await api.get(`/dashboard/weekly-report?start=${startDate}&end=${endDate}`);
            return data.report;
        }
    });
};

export const useProjectWeeklyReport = (workspaceId: string, projectId: string, startDate: string, endDate: string) => {
    return useQuery({
        queryKey: ['projectWeeklyReport', projectId, startDate, endDate],
        queryFn: async () => {
            if (!workspaceId || !projectId) return [];
            const { data } = await api.get(`/workspaces/${workspaceId}/projects/${projectId}/weekly-report?start=${startDate}&end=${endDate}`);
            return data.report;
        },
        enabled: !!workspaceId && !!projectId
    });
};

export const useDashboardPhotos = () => {
    return useQuery({
        queryKey: ['dashboardPhotos'],
        queryFn: async () => {
            const { data } = await api.get('/dashboard/photos');
            return data.photos;
        }
    });
};

export const useAddDashboardPhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (photoData: { photo_url: string }) => {
            const { data } = await api.post('/dashboard/photos', photoData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardPhotos'] });
        }
    });
};

export const useDeleteDashboardPhoto = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/dashboard/photos/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dashboardPhotos'] });
        }
    });
};

// --- NOTIFICATIONS ---
export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const { data } = await api.get('/notifications');
            return data.notifications;
        },
        refetchInterval: 30000 // Poll every 30 seconds
    });
};

export const useMarkNotificationRead = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.put(`/notifications/${id}/read`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};

export const useRemindNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, remindAt }: { id: number; remindAt: string }) => {
            const { data } = await api.put(`/notifications/${id}/remind`, { remind_at: remindAt });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};

export const useFlagNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.put(`/notifications/${id}/flag`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};

    export const useDeleteNotification = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/notifications/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
    });
};

// --- USER PROFILE ---
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (updateData: { personal_notes_icon?: string }) => {
            const { data } = await api.put('/user/profile', updateData);
            return data;
        },
        onSuccess: (data) => {
            const currentUserStr = localStorage.getItem('auth-storage');
            if (currentUserStr) {
                try {
                    const parsed = JSON.parse(currentUserStr);
                    if (parsed.state && parsed.state.user) {
                        parsed.state.user.personal_notes_icon = data.user.personal_notes_icon;
                        localStorage.setItem('auth-storage', JSON.stringify(parsed));
                        window.dispatchEvent(new Event('auth-updated'));
                    }
                } catch (e) {}
            }
        }
    });
};

// --- PERSONAL NOTES ---
export const usePersonalNotes = () => {
    return useQuery({
        queryKey: ['personalNotes'],
        queryFn: async () => {
            const { data } = await api.get('/personal-notes');
            return data.notes;
        }
    });
};

export const useCreatePersonalNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (noteData: { title: string; content?: string }) => {
            const { data } = await api.post('/personal-notes', noteData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
        }
    });
};

export const useUpdatePersonalNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updateData }: { id: number; title?: string; content?: string }) => {
            const { data } = await api.put(`/personal-notes/${id}`, updateData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
        }
    });
};

export const useDeletePersonalNote = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.delete(`/personal-notes/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personalNotes'] });
        }
    });
};
