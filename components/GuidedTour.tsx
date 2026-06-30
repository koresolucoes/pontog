import React, { useState, useEffect } from 'react';
import { Joyride, CallBackProps, STATUS, Step } from 'react-joyride';
import { useAuthStore } from '../stores/authStore';

export const GuidedTour: React.FC = () => {
    const { user, finishTour } = useAuthStore();
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Run tour only if user has finished onboarding and hasn't seen the tour yet
        if (user && user.has_completed_onboarding && !user.has_seen_tour) {
            setRun(true);
        }
    }, [user]);

    const steps: Step[] = [
        {
            target: 'body',
            placement: 'center',
            content: (
                <div className="text-left font-outfit">
                    <h2 className="text-xl font-bold mb-2">Bem-vindo ao Ponto G! 🎉</h2>
                    <p className="text-slate-600 text-sm">
                        Vamos fazer um tour rápido para te mostrar como encontrar caras por perto, mandar winks, e organizar seus chats.
                    </p>
                </div>
            ),
            disableBeacon: true,
        },
        {
            target: '.tour-step-map',
            content: (
                <div className="text-left font-outfit">
                    <h2 className="text-lg font-bold mb-1">O Mapa 📍</h2>
                    <p className="text-slate-600 text-sm">
                        Veja quem está perto de você. O mapa é o coração do app e atualiza em tempo real. Você pode alternar para o modo Lista (Grid) se preferir.
                    </p>
                </div>
            ),
        },
        {
            target: '.tour-step-inbox',
            content: (
                <div className="text-left font-outfit">
                    <h2 className="text-lg font-bold mb-1">Seu Inbox 💬</h2>
                    <p className="text-slate-600 text-sm">
                        Aqui ficam seus chats, quem te enviou um Wink, pedidos de álbuns, favoritos e quem visitou seu perfil.
                    </p>
                </div>
            ),
        },
        {
            target: '.tour-step-profile',
            content: (
                <div className="text-left font-outfit">
                    <h2 className="text-lg font-bold mb-1">Seu Perfil 👤</h2>
                    <p className="text-slate-600 text-sm">
                        Atualize suas fotos, gerencie seus álbuns privados e ganhe o selo de verificado para ganhar destaque!
                    </p>
                </div>
            ),
        },
        {
            target: '.tour-step-menu',
            content: (
                <div className="text-left font-outfit">
                    <h2 className="text-lg font-bold mb-1">Menu Principal ☰</h2>
                    <p className="text-slate-600 text-sm">
                        Aqui você acessa o Ponto G Plus, Notícias e outras configurações. Divirta-se!
                    </p>
                </div>
            ),
        }
    ];

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status, action } = data;
        const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

        if (finishedStatuses.includes(status) || action === 'close') {
            setRun(false);
            finishTour(); // Update database and local state
        }
    };

    if (!user || user.has_seen_tour) return null;

    return (
        <Joyride
            callback={handleJoyrideCallback}
            continuous
            hideCloseButton
            run={run}
            scrollToFirstStep
            showProgress
            showSkipButton
            steps={steps}
            styles={{
                options: {
                    primaryColor: '#db2777', // pink-600
                    zIndex: 100000,
                    backgroundColor: '#ffffff',
                    textColor: '#1e293b', // slate-800
                },
                tooltipContainer: {
                    textAlign: 'left'
                },
                buttonNext: {
                    backgroundColor: '#db2777',
                    borderRadius: '8px',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                },
                buttonBack: {
                    color: '#64748b',
                    fontFamily: 'Inter',
                },
                buttonSkip: {
                    color: '#94a3b8',
                    fontFamily: 'Inter',
                }
            }}
            locale={{
                back: 'Anterior',
                close: 'Fechar',
                last: 'Terminar',
                next: 'Próximo',
                open: 'Abrir diálogo',
                skip: 'Pular Tour'
            }}
        />
    );
};
