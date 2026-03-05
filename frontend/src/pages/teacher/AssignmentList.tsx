import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';
import type { Course, Assignment } from '../../types';

export default function AssignmentList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const coursesRes = await api.get('/courses');
      setCourses(coursesRes.data);
      const all: Assignment[] = [];
      for (const course of coursesRes.data) {
        const res = await api.get(`/assignments?course_id=${course.id}`);
        all.push(...res.data);
      }
      setAssignments(all);
    } catch (err) {
      console.error('Failed to load assignments', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/publish`);
      toast.success('Assignment published!');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to publish');
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.post(`/assignments/${id}/close`);
      toast.success('Assignment closed');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to close');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      toast.success('Assignment deleted');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to delete');
    }
  };

  const getCourseName = (courseId: string) =>
    courses.find((c) => c.id === courseId)?.title || 'Unknown';

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-center mb-8">
        <img src="/assets/diamond.png" alt="" className="h-10 w-auto" />
      </div>

      <h1 className="font-serif text-3xl text-charcoal-800 tracking-wider uppercase text-center mb-1">
        Assignments
      </h1>
      <div className="flex justify-end mb-1">
        <Link
          to="/teacher/assignments/create"
          className="text-xs text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
        >
          + Create Assignment
        </Link>
      </div>

      <hr className="dotted-divider" />

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-warmgray-400 font-display italic text-lg">No assignments yet</p>
          <Link
            to="/teacher/assignments/create"
            className="inline-block mt-3 text-xs text-warmgray-400 hover:text-charcoal-800 transition-colors"
          >
            Create your first assignment
          </Link>
        </div>
      ) : (
        <div className="timeline">
          {assignments.map((a) => (
            <div key={a.id} className="timeline-item">
              <div className="timeline-bullet">
                <img src="/assets/diamond.png" alt="" />
              </div>
              <div className="timeline-bar">
                <div className="flex-1">
                  <p className="font-serif text-sm text-charcoal-800">{a.title}</p>
                  <p className="text-xs text-warmgray-400 mt-0.5">{getCourseName(a.course_id)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[0.6rem] text-warmgray-400 uppercase tracking-wider">
                    {a.status}
                  </span>

                  {a.status === 'draft' && (
                    <button
                      onClick={() => handlePublish(a.id)}
                      className="text-[0.65rem] text-charcoal-600 uppercase tracking-wider hover:text-charcoal-900 transition-colors cursor-pointer"
                    >
                      Publish
                    </button>
                  )}

                  {a.status === 'published' && (
                    <>
                      <Link
                        to={`/teacher/assignments/${a.id}/review`}
                        className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors"
                      >
                        Review
                      </Link>
                      <button
                        onClick={() => handleClose(a.id)}
                        className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-charcoal-800 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-[0.65rem] text-warmgray-400 uppercase tracking-wider hover:text-red-400 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
