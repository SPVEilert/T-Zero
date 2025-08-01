import React, { useEffect, useState, useCallback } from "react";
import ScrollWindow from "./ScrollWindow";
import LaunchesService from "./API/launchesService";
import { LaunchItem } from "./API/types";

const PAGE_SIZE = 20;

const LaunchesContainer: React.FC = () => {
  const [launches, setLaunches] = useState<LaunchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const [page, setPage] = useState(0);

  // Load launches for a page (combine upcoming and past or only upcoming/past)
  const loadLaunches = useCallback(async (pageNum: number) => {
    setLoading(true);
    try {
      // If you want only upcoming launches:
      // const data = await LaunchesService.fetchCombinedLaunches(true);

      // For pagination, you might modify your service or just fetch all and slice.
      // Here we'll just fetch upcoming launches and slice manually:
      const data = await LaunchesService.fetchCombinedLaunches(true); // or false for past
      const pagedData = data.slice(
        pageNum * PAGE_SIZE,
        (pageNum + 1) * PAGE_SIZE,
      );

      if (pagedData.length === 0) {
        setNoMoreData(true);
      } else {
        setLaunches((prev) => [...prev, ...pagedData]);
        setPage(pageNum + 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLaunches(0);
  }, [loadLaunches]);

  const handleLoadMore = () => {
    if (!loading && !noMoreData) {
      loadLaunches(page);
    }
  };

  return (
    <ScrollWindow
      launches={launches}
      loading={loading}
      noMoreData={noMoreData}
      onLoadMore={handleLoadMore}
    />
  );
};

export default LaunchesContainer;
