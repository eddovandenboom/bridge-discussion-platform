import { Link } from 'react-router-dom';

interface Tournament {
  id: string;
  name: string;
  date: string;
  venue: string | null;
  filename: string;
  createdAt: string;
  uploader: {
    id: string;
    username: string;
  };
  circles: Array<{
    circle: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    comments: number;
  };
}

interface TournamentCardProps {
  tournament: Tournament;
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link 
              to={`/tournament/${tournament.id}`}
              className="block"
            >
              <h3 className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                {tournament.name}
              </h3>
            </Link>
            
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {formatDate(tournament.date)}
              </p>
              
              {tournament.venue && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Venue:</span> {tournament.venue}
                </p>
              )}
              
              <p className="text-sm text-gray-600">
                <span className="font-medium">Uploaded by:</span> {tournament.uploader.username}
              </p>
            </div>
          </div>
          
          <div className="ml-4 text-right">
            <div className="text-sm text-gray-500">
              {tournament._count.comments} comment{tournament._count.comments !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {tournament.circles.length > 0 && (
          <div className="mt-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Shared in:</span>
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              {tournament.circles.map((circleRelation) => (
                <span
                  key={circleRelation.circle.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {circleRelation.circle.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Uploaded {formatDate(tournament.createdAt)}
          </div>
          
          <Link
            to={`/tournament/${tournament.id}`}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}