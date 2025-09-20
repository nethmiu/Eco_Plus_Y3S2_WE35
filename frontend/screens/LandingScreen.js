import React, { useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    SafeAreaView, 
    Animated, 
    Dimensions,
    StatusBar 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Enhanced logo with gradient and glow effect
const AppLogo = ({ animatedScale }) => (
    <Animated.View style={[styles.logoContainer, { transform: [{ scale: animatedScale }] }]}>
        <View style={styles.logoGlow}>
            <Svg height="80" width="80" viewBox="0 0 24 24">
                <Defs>
                    <RadialGradient id="logoGradient" cx="50%" cy="50%" r="50%">
                        <Stop offset="0%" stopColor="#66BB6A" />
                        <Stop offset="100%" stopColor="#4CAF50" />
                    </RadialGradient>
                </Defs>
                <Circle 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    fill="rgba(76, 175, 80, 0.1)" 
                    stroke="rgba(76, 175, 80, 0.2)" 
                    strokeWidth="0.5"
                />
                <Path 
                    fill="url(#logoGradient)" 
                    d="M12.4,5.1C12.2,4.8,12,4.2,12,4c-0.4,0-1,0.2-1.4,0.6C10.2,5,9.9,5.4,9.9,5.7c0,0.4,0.2,0.8,0.6,1.2c0,0,0,0,0,0 c-1.2,1-2.1,2.4-2.4,3.9c-0.4,2,0.2,4.1,1.6,5.5C10.2,17,10.9,17.4,12,17.4V19c-2.1,0-4-0.9-5.4-2.3C4.8,15,4,12.7,4.4,10.3 c0.5-2.9,2.4-5.2,4.9-6.2C9.5,4,9.8,4,10.1,4c0.7,0,1.4,0.3,1.9,0.8C12.2,5,12.3,5,12.4,5.1z M19.6,10.3c-0.4-2.4-2.2-4.5-4.5-5.5 c-0.1,0-0.2-0.1-0.2-0.2c0.2-0.2,0.3-0.4,0.3-0.6c0-0.6-0.5-1.1-1.1-1.1c-0.5,0-0.9,0.3-1.1,0.7c0.2,0.3,0.4,0.8,0.4,1.1 c0.4,0,1,0.2,1.4,0.6c0.4,0.4,0.6,0.8,0.6,1.2c0,0.4-0.2,0.8-0.6,1.2c0,0,0,0,0,0c1.2,1,2.1,2.4,2.4,3.9c0.4,2-0.2,4.1-1.6,5.5 c-0.5,0.5-1.1,0.7-1.8,0.7V19c2.1,0,4-0.9,5.4-2.3C21.2,15,22,12.7,21.6,10.3z" 
                />
            </Svg>
        </View>
        <Text style={styles.appName}>Eco - Pulse</Text>
        <View style={styles.tagline}>
            <View style={styles.taglineDot} />
            <Text style={styles.taglineText}>Premium Sustainability</Text>
        </View>
    </Animated.View>
);

// Floating background elements
const FloatingElement = ({ delay, duration, translateY, opacity }) => {
    const animValue = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
        const animate = () => {
            Animated.sequence([
                Animated.delay(delay),
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(animValue, {
                            toValue: 1,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                        Animated.timing(animValue, {
                            toValue: 0,
                            duration: duration,
                            useNativeDriver: true,
                        }),
                    ])
                )
            ]).start();
        };
        animate();
    }, []);

    return (
        <Animated.View
            style={[
                styles.floatingElement,
                {
                    opacity: animValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: [opacity, opacity * 0.3],
                    }),
                    transform: [{
                        translateY: animValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, translateY],
                        })
                    }]
                }
            ]}
        />
    );
};

export default function LandingScreen({ navigation }) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(60)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const logoScale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 40,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ])
        ]).start();
    }, []);

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <LinearGradient
                colors={['#FAFBFC', '#F8FFFE', '#F5F9F6']}
                locations={[0, 0.5, 1]}
                style={styles.container}
            >
                {/* Floating background elements */}
                <FloatingElement delay={0} duration={4000} translateY={-20} opacity={0.4} />
                <FloatingElement delay={1000} duration={3500} translateY={-15} opacity={0.3} />
                <FloatingElement delay={2000} duration={4500} translateY={-25} opacity={0.2} />

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <AppLogo animatedScale={logoScale} />
                        
                        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                            <Text style={styles.title}>
                                Your Pulse for a{'\n'}
                                <Text style={styles.titleHighlight}>Greener Planet</Text>
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.subtitle}>
                                Experience premium sustainability tracking with elegant design. 
                                Join our exclusive community in building a sustainable Sri Lanka.
                            </Text>
                        </Animated.View>
                    </View>

                    <Animated.View 
                        style={[
                            styles.buttonContainer, 
                            { 
                                transform: [
                                    { translateY: slideAnim },
                                    { scale: scaleAnim }
                                ], 
                                opacity: fadeAnim 
                            }
                        ]}
                    >
                        <TouchableOpacity 
                            style={styles.primaryButton} 
                            onPress={() => navigation.navigate('Register')}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#66BB6A', '#4CAF50', '#388E3C']}
                                locations={[0, 0.5, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.primaryButtonGradient}
                            >
                                <Text style={styles.primaryButtonText}>Create Premium Account</Text>
                                <View style={styles.buttonIcon}>
                                    <Text style={styles.buttonIconText}>→</Text>
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.secondaryButton} 
                            onPress={() => navigation.navigate('Login')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.secondaryButtonText}>Sign In</Text>
                        </TouchableOpacity>

                        <View style={styles.footerText}>
                            <Text style={styles.footerLabel}>Join 10,000+ eco-conscious users</Text>
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </LinearGradient>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    floatingElement: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        top: '20%',
        right: '-10%',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingTop: 60,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoGlow: {
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    appName: {
        fontSize: 42,
        fontWeight: '700',
        color: '#1B4332',
        marginTop: 16,
        letterSpacing: -0.5,
        textShadowColor: 'rgba(27, 67, 50, 0.1)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    tagline: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    taglineDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#4CAF50',
        marginRight: 8,
    },
    taglineText: {
        fontSize: 12,
        color: '#52796F',
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: '300',
        textAlign: 'center',
        color: '#2D3436',
        lineHeight: 40,
        marginBottom: 20,
    },
    titleHighlight: {
        fontWeight: '700',
        color: '#388E3C',
    },
    divider: {
        width: 60,
        height: 2,
        backgroundColor: '#4CAF50',
        borderRadius: 1,
        marginBottom: 24,
        opacity: 0.6,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        color: '#636E72',
        lineHeight: 26,
        fontWeight: '400',
        maxWidth: width * 0.85,
    },
    buttonContainer: {
        paddingHorizontal: 32,
        paddingBottom: 50,
    },
    primaryButton: {
        marginBottom: 16,
        borderRadius: 16,
        shadowColor: '#388E3C',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    primaryButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 16,
    },
    primaryButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    buttonIcon: {
        marginLeft: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonIconText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    secondaryButton: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: 'rgba(76, 175, 80, 0.08)',
        borderWidth: 1,
        borderColor: 'rgba(76, 175, 80, 0.2)',
        marginBottom: 24,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#388E3C',
        letterSpacing: 0.2,
    },
    footerText: {
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: 13,
        color: '#74B9FF',
        fontWeight: '500',
        opacity: 0.8,
    },
});