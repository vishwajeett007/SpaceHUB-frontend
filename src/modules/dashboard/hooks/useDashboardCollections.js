import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getAllLocalGroups, getMyCommunities } from '../../../shared/services/API';
import { showToast } from '../../../shared/services/toast';
import {
  selectActiveTab,
  selectCommunities,
  selectDashboardError,
  selectDashboardLoading,
  selectLocalGroups,
  setActiveTab,
  setCommunities,
  setError,
  setLoading,
  setLocalGroups,
} from '../../../shared/store/slices/dashboardSlice';

export const useDashboardCollections = (userEmail) => {
  const dispatch = useDispatch();
  const activeTab = useSelector(selectActiveTab);
  const communities = useSelector(selectCommunities);
  const error = useSelector(selectDashboardError);
  const loading = useSelector(selectDashboardLoading);
  const localGroups = useSelector(selectLocalGroups);
  const cacheRestoredRef = useRef({ communities: false, localGroups: false });

  const fetchCommunities = useCallback(async () => {
    // Restore from cache only once on first render (before API call)
    if (!cacheRestoredRef.current.communities) {
      cacheRestoredRef.current.communities = true;
      try {
        const cached = sessionStorage.getItem('cachedMyCommunities');
        if (cached) {
          dispatch(setCommunities(JSON.parse(cached)));
        }
      } catch (e) {
        console.warn('Failed to read cached communities:', e);
      }
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setLoading(false));
      return;
    }

    try {
      const response = await getMyCommunities(userEmail);
      const list = response?.data?.communities || response?.communities || response?.data || [];
      dispatch(setCommunities(list));
      try {
        sessionStorage.setItem('cachedMyCommunities', JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to cache communities:', e);
      }
    } catch (requestError) {
      const message = requestError.message || 'Failed to load communities';
      dispatch(setError(message));
      showToast(message, 'error');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, userEmail]);

  const fetchLocalGroups = useCallback(async () => {
    if (!cacheRestoredRef.current.localGroups) {
      cacheRestoredRef.current.localGroups = true;
      try {
        const cached = sessionStorage.getItem('cachedLocalGroups');
        if (cached) {
          dispatch(setLocalGroups(JSON.parse(cached)));
        }
      } catch (e) {
        console.warn('Failed to read cached local groups:', e);
      }
    }

    dispatch(setLoading(true));
    dispatch(setError(''));

    if (!userEmail) {
      dispatch(setError('User email not found'));
      dispatch(setLoading(false));
      return;
    }

    try {
      const response = await getAllLocalGroups(userEmail);
      const list = response?.data?.groups
        || response?.groups
        || response?.data
        || response?.rooms
        || [];
      dispatch(setLocalGroups(list));
      try {
        sessionStorage.setItem('cachedLocalGroups', JSON.stringify(list));
      } catch (e) {
        console.warn('Failed to cache local groups:', e);
      }
    } catch (requestError) {
      const message = requestError.message || 'Failed to load local groups';
      dispatch(setError(message));
      showToast(message, 'error');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, userEmail]);

  useEffect(() => {
    if (activeTab === 'Community') {
      fetchCommunities();
      return;
    }
    fetchLocalGroups();
  }, [activeTab, fetchCommunities, fetchLocalGroups]);

  useEffect(() => {
    window.addEventListener('refresh:communities', fetchCommunities);
    window.addEventListener('refresh:local-groups', fetchLocalGroups);

    return () => {
      window.removeEventListener('refresh:communities', fetchCommunities);
      window.removeEventListener('refresh:local-groups', fetchLocalGroups);
    };
  }, [fetchCommunities, fetchLocalGroups]);

  const changeActiveTab = useCallback((tab) => {
    dispatch(setActiveTab(tab));
  }, [dispatch]);

  return {
    activeTab,
    changeActiveTab,
    communities,
    error,
    loading,
    localGroups,
  };
};
