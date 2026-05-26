import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Calendar,
  Trash2,
  ExternalLink,
  Plus,
  Filter,
  Bookmark,
  Mail,
  Mic,
  PartyPopper,
  XCircle,
  BarChart2,
} from "lucide-react";
import Layout from "../components/Layout";
import { jobTrackerApi } from "../services/api";
import Button from "../components/Button";
import Card from "../components/Card";
import EmptyJobState from "../components/EmptyJobState";
import CompanyResearch from "../components/CompanyResearch";
import { Sparkles } from "lucide-react";
import { SkeletonDashboard } from "../components/ui/Skeleton.jsx";

const JobTracker = () => {
  const [trackedJobs, setTrackedJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updateLoading, setUpdateLoading] = useState({});
  const [researchCompany, setResearchCompany] = useState(null);

  const statusOptions = [
    {
      value: "saved",
      label: "Saved",
      color: "bg-muted-foreground",
      icon: Bookmark,
      iconColor: "text-slate-400",
      iconBg: "bg-slate-400/10",
    },
    {
      value: "applied",
      label: "Applied",
      color: "bg-blue-500",
      icon: Mail,
      iconColor: "text-blue-400",
      iconBg: "bg-blue-400/10",
    },
    {
      value: "interviewing",
      label: "Interviewing",
      color: "bg-yellow-500",
      icon: Mic,
      iconColor: "text-yellow-400",
      iconBg: "bg-yellow-400/10",
    },
    {
      value: "offered",
      label: "Offered",
      color: "bg-green-500",
      icon: PartyPopper,
      iconColor: "text-green-400",
      iconBg: "bg-green-400/10",
    },
    {
      value: "rejected",
      label: "Rejected",
      color: "bg-red-500",
      icon: XCircle,
      iconColor: "text-red-400",
      iconBg: "bg-red-400/10",
    },
  ];

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobTrackerApi.getAll();
      setTrackedJobs(data.trackedJobs || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load tracked jobs", { id: "tracked-jobs-load-error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await jobTrackerApi.getStats();
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      setUpdateLoading((prev) => ({ ...prev, [jobId]: true }));
      await jobTrackerApi.updateStatus(jobId, newStatus);

      setTrackedJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? { ...job, status: newStatus, updatedAt: new Date() }
            : job,
        ),
      );

      toast.success("Status updated!");
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status", { id: `tracked-job-update-error-${jobId}` });
    } finally {
      setUpdateLoading((prev) => ({ ...prev, [jobId]: false }));
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;
    
    // Optimistic UI update
    setTrackedJobs((prev) =>
      prev.map((job) =>
        job.id === draggableId
          ? { ...job, status: newStatus, updatedAt: new Date() }
          : job,
      ),
    );

    // Backend update
    try {
      await jobTrackerApi.updateStatus(draggableId, newStatus);
      toast.success("Status updated!");
      fetchStats();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
      // Revert on failure
      fetchJobs();
    }
  };

  const handleDelete = async (jobId) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this job from your tracker?",
      )
    ) {
      return;
    }

    try {
      await jobTrackerApi.delete(jobId);
      setTrackedJobs((prev) => prev.filter((job) => job.id !== jobId));
      toast.success("Job removed from tracker");
      fetchStats();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to remove job", { id: `tracked-job-delete-error-${jobId}` });
    }
  };

  const getStatusInfo = (status) => {
    return (
      statusOptions.find((opt) => opt.value === status) || statusOptions[0]
    );
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-background py-8 px-4">
          <div className="max-w-7xl mx-auto">
            <SkeletonDashboard />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Job Tracker
            </h1>
            <p className="text-muted-foreground">
              Track your job applications in one place
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total', value: stats.total, icon: BarChart2, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
                { label: 'Saved', value: stats.saved, icon: Bookmark, iconColor: 'text-slate-400', iconBg: 'bg-slate-400/10' },
                { label: 'Applied', value: stats.applied, icon: Mail, iconColor: 'text-blue-400', iconBg: 'bg-blue-400/10' },
                { label: 'Interviewing', value: stats.interviewing, icon: Mic, iconColor: 'text-yellow-400', iconBg: 'bg-yellow-400/10' },
                { label: 'Offered', value: stats.offered, icon: PartyPopper, iconColor: 'text-green-400', iconBg: 'bg-green-400/10' },
              ].map(({ label, value, icon: Icon, iconColor, iconBg }) => (
                <Card key={label} className="p-6 bg-background/50 border-border hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">{label}</p>
                      <p className="text-3xl font-bold text-foreground">{value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filterStatus === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              All Columns
            </button>
            {statusOptions.map((status) => {
              const StatusIcon = status.icon;
              return (
                <button
                  key={status.value}
                  onClick={() => setFilterStatus(status.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    filterStatus === status.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                >
                  <StatusIcon className="w-4 h-4" /> {status.label}
                </button>
              );
            })}
          </div>

          {/* Kanban Board */}
          {trackedJobs.length === 0 ? (
            <Card className="p-12 text-center bg-background/50 border-border">
              <div className="max-w-md mx-auto">
                <Briefcase className="w-16 h-16 text-muted-foreground/80 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Tracked Jobs Yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking jobs from the job search page
                </p>
                <Button
                  onClick={() => (window.location.href = "/jobs")}
                  className="mx-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Find Jobs
                </Button>
              </div>
            </Card>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex gap-6 overflow-x-auto pb-8 min-h-[60vh] snap-x scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {statusOptions
                  .filter((status) => filterStatus === "all" || status.value === filterStatus)
                  .map((status) => {
                  const columnJobs = trackedJobs.filter((j) => j.status === status.value);

                  return (
                    <div key={status.value} className="shrink-0 w-80 bg-muted/20 rounded-2xl p-4 flex flex-col snap-start border border-border/40 shadow-sm">
                      <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-bold flex items-center gap-2 text-foreground text-sm uppercase tracking-wider">
                          {(() => { const ColIcon = status.icon; return <ColIcon className={`w-4 h-4 ${status.iconColor}`} />; })()}
                          {status.label}
                        </h3>
                        <span className="bg-background px-2.5 py-0.5 rounded-full text-xs font-black border border-border text-muted-foreground">
                          {columnJobs.length}
                        </span>
                      </div>

                      <Droppable droppableId={status.value}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`flex-1 flex flex-col gap-3 min-h-[150px] transition-colors rounded-xl p-1.5 ${snapshot.isDraggingOver ? 'bg-primary/5 border border-primary/20 border-dashed' : 'border border-transparent'}`}
                          >
                            {columnJobs.map((job, index) => (
                              <Draggable key={job.id} draggableId={job.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    style={{
                                      ...provided.draggableProps.style,
                                    }}
                                  >
                                    <Card className={`p-4 bg-card hover:border-primary/40 transition-all ${snapshot.isDragging ? 'shadow-2xl shadow-primary/20 scale-105 rotate-2 z-50 border-primary ring-2 ring-primary/20' : 'border-border/60 shadow-sm hover:-translate-y-0.5'}`}>
                                      <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-foreground text-sm line-clamp-2 leading-tight pr-4">
                                          {job.title}
                                        </h4>
                                        <button
                                          onClick={() => handleDelete(job.id)}
                                          className="text-muted-foreground/50 hover:text-red-500 transition-colors absolute top-4 right-4"
                                          title="Remove Job"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      <p className="text-primary font-black text-xs mb-3 tracking-wide">
                                        {job.company}
                                      </p>
                                      
                                      <div className="flex flex-col gap-1.5 text-[11px] font-semibold text-muted-foreground mb-4">
                                        {job.location && (
                                          <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-foreground/40" /> {job.location}
                                          </div>
                                        )}
                                        {job.salary && (
                                          <div className="flex items-center gap-1.5">
                                            <DollarSign className="w-3.5 h-3.5 text-foreground/40" /> {job.salary}
                                          </div>
                                        )}
                                        <div className="flex items-center gap-1.5">
                                          <Calendar className="w-3.5 h-3.5 text-foreground/40" /> 
                                          Added {formatDate(job.createdAt)}
                                        </div>
                                      </div>

                                      <div className="flex gap-2 mt-auto pt-3 border-t border-border/50">
                                        {job.applyLink && (
                                          <a
                                            href={job.applyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 bg-primary text-background hover:bg-primary/90 py-1.5 rounded-md text-xs font-bold text-center transition-colors flex items-center justify-center gap-1"
                                          >
                                            <ExternalLink className="w-3 h-3" /> Apply
                                          </a>
                                        )}
                                        <button
                                          onClick={() =>
                                            setResearchCompany({
                                              name: job.company,
                                              industry: job.industry || "",
                                            })
                                          }
                                          className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary py-1.5 rounded-md text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1"
                                        >
                                          <Sparkles className="w-3 h-3" /> AI Research
                                        </button>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
        </div>
      </div>
      {researchCompany && (
        <CompanyResearch
          companyName={researchCompany.name}
          industry={researchCompany.industry}
          onClose={() => setResearchCompany(null)}
        />
      )}
    </Layout>
  );
};

export default JobTracker;
