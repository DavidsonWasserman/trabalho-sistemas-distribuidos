import jetPaths from 'jet-paths';
import transformPaths from '../utils/transform-paths';

const Paths = {
    _: '/api',
    User: {
        _: '/user',
        Login: '/login',
        Me: '/me',
        byId: '/byId/:id',
        search: '/search/:query'
    }
} as const;

export const JetPaths = jetPaths(Paths);
export default Paths;
export const APIPaths = transformPaths(Paths)
