<?php

namespace App\Traits;

use App\Exceptions\StaleModelException;
use Illuminate\Database\Eloquent\Model;

trait HasOptimisticLocking
{
    /**
     * Boot the optimistic locking trait.
     */
    protected static function bootHasOptimisticLocking(): void
    {
        // Increment version on update
        static::updating(function (Model $model) {
            if ($model->isDirty() && !$model->isDirty('version')) {
                $model->increment('version');
            }
        });

        // Check version before saving
        static::saving(function (Model $model) {
            if ($model->exists && $model->isDirty() && !$model->wasRecentlyCreated) {
                $originalVersion = $model->getOriginal('version');
                
                // Check if the version in the database matches our expected version
                $currentVersion = static::where('id', $model->id)
                    ->value('version');
                
                if ($currentVersion !== null && $currentVersion != $originalVersion) {
                    throw new StaleModelException(
                        class_basename($model),
                        $originalVersion,
                        $currentVersion
                    );
                }
            }
        });
    }

    /**
     * Perform a model update operation with optimistic locking.
     */
    public function updateWithLock(array $attributes): bool
    {
        $originalVersion = $this->version;
        
        // Update attributes
        $this->fill($attributes);
        
        // Perform the update with version check
        $affected = static::where('id', $this->id)
            ->where('version', $originalVersion)
            ->update(array_merge(
                $this->getDirty(),
                ['version' => $originalVersion + 1]
            ));
        
        if ($affected === 0) {
            // Version mismatch - record was modified by another process
            $currentVersion = static::where('id', $this->id)->value('version');
            
            throw new StaleModelException(
                class_basename($this),
                $originalVersion,
                $currentVersion
            );
        }
        
        // Refresh the model to get the new version
        $this->refresh();
        
        return true;
    }

    /**
     * Get the version column name.
     */
    public function getVersionColumn(): string
    {
        return 'version';
    }
}
