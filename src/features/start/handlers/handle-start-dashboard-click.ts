import { signInWithGitHub } from '../../../services/github';

export const handleStartDashboardClick = () => {
  signInWithGitHub();
};
