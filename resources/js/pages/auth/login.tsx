import AuthenticatedSessionController from '@/actions/App/Http/Controllers/Auth/AuthenticatedSessionController';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, Clock, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    redirect?: string;
    rateLimitInfo?: {
        remaining: number;
        max: number;
    };
}

export default function Login({ status, canResetPassword, redirect, rateLimitInfo }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [rateLimitedUntil, setRateLimitedUntil] = useState<number | null>(null);
    const [countdown, setCountdown] = useState<number>(0);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(rateLimitInfo?.remaining ?? null);
    const [maxAttempts, setMaxAttempts] = useState<number>(rateLimitInfo?.max ?? 5);

    // Sync with rate limit info from props
    useEffect(() => {
        if (rateLimitInfo) {
            setAttemptsRemaining(rateLimitInfo.remaining);
            setMaxAttempts(rateLimitInfo.max);
        }
    }, [rateLimitInfo]);

    // Check for rate limit in localStorage
    useEffect(() => {
        const storedRateLimit = localStorage.getItem('login_rate_limit');
        
        if (storedRateLimit) {
            const rateLimitTime = parseInt(storedRateLimit);
            const now = Date.now();
            if (rateLimitTime > now) {
                setRateLimitedUntil(rateLimitTime);
                setCountdown(Math.ceil((rateLimitTime - now) / 1000));
            } else {
                localStorage.removeItem('login_rate_limit');
            }
        }
    }, []);



    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (countdown === 0 && rateLimitedUntil) {
            setRateLimitedUntil(null);
            localStorage.removeItem('login_rate_limit');
            toast.success('You can try logging in again now');
        }
    }, [countdown, rateLimitedUntil]);

    // Handle rate limit error
    const handleRateLimitError = (retryAfter: number = 60) => {
        const rateLimitTime = Date.now() + (retryAfter * 1000);
        localStorage.setItem('login_rate_limit', rateLimitTime.toString());
        setRateLimitedUntil(rateLimitTime);
        setCountdown(retryAfter);
        
        toast.error('Too Many Login Attempts', {
            description: `Please wait ${retryAfter} seconds before trying again`,
            icon: <AlertTriangle className="h-5 w-5" />,
            duration: 5000,
        });
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins > 0) {
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }
        return `${secs}s`;
    };

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...AuthenticatedSessionController.store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
                onError={(errors) => {
                    // Check if it's a rate limit error
                    if (errors.email && errors.email.includes('Too many')) {
                        // Extract retry-after from error message or default to 60 seconds
                        const match = errors.email.match(/(\d+)\s*seconds?/i);
                        const retryAfter = match ? parseInt(match[1]) : 60;
                        handleRateLimitError(retryAfter);
                    } else if (errors.email || errors.password) {
                        // Failed login attempt - decrement remaining attempts
                        if (attemptsRemaining !== null && attemptsRemaining > 0) {
                            const newRemaining = attemptsRemaining - 1;
                            setAttemptsRemaining(newRemaining);
                            
                            // Show toast notification
                            if (newRemaining <= 1) {
                                toast.error('Critical: Last Attempt!', {
                                    description: `Only ${newRemaining} login attempt remaining`,
                                    duration: 5000,
                                });
                            } else if (newRemaining <= 2) {
                                toast.warning('Warning: Low Attempts', {
                                    description: `${newRemaining} attempts remaining`,
                                    duration: 4000,
                                });
                            }
                        }
                    }
                }}
            >
                {({ processing, errors }) => (
                    <>
                        {/* Rate Limit Warning */}
                        {rateLimitedUntil && countdown > 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-semibold text-red-900 dark:text-red-100">
                                            Too Many Login Attempts
                                        </h3>
                                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                            Please wait <span className="font-mono font-bold">{formatTime(countdown)}</span> before trying again
                                        </p>
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                            You've exceeded the maximum of {maxAttempts} login attempts per minute
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ) : attemptsRemaining !== null && attemptsRemaining < maxAttempts ? (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-lg p-3 border ${
                                    attemptsRemaining <= 2 
                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' 
                                        : attemptsRemaining <= 3
                                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Clock className={`h-4 w-4 ${
                                        attemptsRemaining <= 2 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : attemptsRemaining <= 3
                                            ? 'text-amber-600 dark:text-amber-400'
                                            : 'text-blue-600 dark:text-blue-400'
                                    }`} />
                                    <p className={`text-sm ${
                                        attemptsRemaining <= 2 
                                            ? 'text-red-700 dark:text-red-300' 
                                            : attemptsRemaining <= 3
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : 'text-blue-700 dark:text-blue-300'
                                    }`}>
                                        <span className="font-semibold">{attemptsRemaining}</span> of {maxAttempts} login attempt{attemptsRemaining === 1 ? '' : 's'} remaining
                                    </p>
                                </div>
                            </motion.div>
                        ) : null}

                        {/* Hidden redirect field */}
                        {redirect && (
                            <input type="hidden" name="redirect" value={redirect} />
                        )}
                        
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="pr-10"
                                    />
                                    <motion.button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <AnimatePresence mode="wait" initial={false}>
                                            {showPassword ? (
                                                <motion.div
                                                    key="eye-off"
                                                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <EyeOff className="h-5 w-5" />
                                                </motion.div>
                                            ) : (
                                                <motion.div
                                                    key="eye"
                                                    initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                                                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                                                    exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                >
                                                    <Eye className="h-5 w-5" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing || (rateLimitedUntil !== null && countdown > 0)}
                                data-test="login-button"
                            >
                                {processing && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                {rateLimitedUntil && countdown > 0 ? (
                                    <>
                                        <Clock className="h-4 w-4 mr-2" />
                                        Wait {formatTime(countdown)}
                                    </>
                                ) : (
                                    'Log in'
                                )}
                            </Button>
                        </div>

                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <TextLink href={register.url()} tabIndex={5}>
                                Sign up
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    {status}
                </div>
            )}
        </AuthLayout>
    );
}
